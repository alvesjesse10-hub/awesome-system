import { Injectable } from '@nestjs/common';
import { ChartAccountGroup, EntryNature, EntryStatus, JobResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { addDaysUTC, startOfDayUTC, sumArray } from './report-math.util';

const DRE_COST_GROUPS: ChartAccountGroup[] = [
  ChartAccountGroup.CUSTO_FIXO,
  ChartAccountGroup.DESPESA_FIXA,
  ChartAccountGroup.CUSTO_VARIAVEL,
  ChartAccountGroup.DESPESA_VARIAVEL,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // DRE
  // ---------------------------------------------------------------------

  async getDre(companyIds: string[], year: number) {
    const groups = Object.values(ChartAccountGroup);
    const sumsByGroup = await Promise.all(groups.map((group) => this.sumEntriesByCompetenceMonth(companyIds, year, group)));
    const byGroup = Object.fromEntries(groups.map((group, index) => [group, sumsByGroup[index]])) as Record<
      ChartAccountGroup,
      number[]
    >;

    const resultadoOperacional = byGroup.RECEITA.map(
      (revenue, i) => revenue - DRE_COST_GROUPS.reduce((total, group) => total + byGroup[group][i], 0),
    );
    const resultadoFinal = resultadoOperacional.map((value, i) => value - byGroup.BONIFICACAO[i]);

    const toRow = (key: string, label: string, months: number[], computed = false) => ({
      key,
      label,
      months,
      total: sumArray(months),
      computed,
    });

    return {
      year,
      companyIds,
      rows: [
        toRow('RECEITA', 'Receita', byGroup.RECEITA),
        toRow('CUSTO_FIXO', 'Custo Fixo', byGroup.CUSTO_FIXO),
        toRow('DESPESA_FIXA', 'Despesa Fixa', byGroup.DESPESA_FIXA),
        toRow('CUSTO_VARIAVEL', 'Custo Variável', byGroup.CUSTO_VARIAVEL),
        toRow('DESPESA_VARIAVEL', 'Despesa Variável', byGroup.DESPESA_VARIAVEL),
        toRow('RESULTADO_OPERACIONAL', 'Resultado Operacional', resultadoOperacional, true),
        toRow('BONIFICACAO', 'Bonificação', byGroup.BONIFICACAO),
        toRow('RESULTADO_FINAL', 'Resultado Final', resultadoFinal, true),
        toRow('INVESTIMENTO', 'Investimento (informativo)', byGroup.INVESTIMENTO),
      ],
    };
  }

  private async sumEntriesByCompetenceMonth(
    companyIds: string[],
    year: number,
    group: ChartAccountGroup,
  ): Promise<number[]> {
    const results = await this.prisma.financialEntry.groupBy({
      by: ['competenceMonth'],
      where: { companyId: { in: companyIds }, competenceYear: year, chartOfAccount: { group } },
      _sum: { amount: true },
    });
    const months = new Array(12).fill(0);
    for (const row of results) {
      months[row.competenceMonth - 1] = Number(row._sum.amount ?? 0);
    }
    return months;
  }

  // ---------------------------------------------------------------------
  // Fluxo de caixa (regime de caixa — paymentDate)
  // ---------------------------------------------------------------------

  async getCashFlow(companyIds: string[], year: number) {
    const yearStart = new Date(Date.UTC(year, 0, 1));

    const [openingBalance, { entries: paidEntries, exits: paidExits }, { transferIn, transferOut }] = await Promise.all([
      this.getBalance(companyIds, yearStart),
      this.monthlyPaidTotals(companyIds, year),
      this.monthlyExternalTransfers(companyIds, year),
    ]);

    let running = openingBalance;
    const months = paidEntries.map((entries, i) => {
      const exits = paidExits[i];
      const inTransfer = transferIn[i];
      const outTransfer = transferOut[i];
      running += entries + inTransfer - exits - outTransfer;
      return {
        month: i + 1,
        entries: entries + inTransfer,
        exits: exits + outTransfer,
        balance: running,
      };
    });

    const currentBalance = await this.getBalance(companyIds);
    const today = startOfDayUTC(new Date());
    // Sem limite inferior: contas já vencidas e não pagas também reduzem o
    // saldo projetado (ainda vão ser pagas mais cedo ou mais tarde), então
    // entram em TODOS os horizontes, não só nas que vencem no futuro.
    const pending = await this.prisma.financialEntry.findMany({
      where: { companyId: { in: companyIds }, status: EntryStatus.PENDING, dueDate: { lte: addDaysUTC(today, 90) } },
      select: { dueDate: true, amount: true, nature: true },
    });

    const projection = [30, 60, 90].map((horizonDays) => {
      const limit = addDaysUTC(today, horizonDays);
      const delta = pending
        .filter((entry) => entry.dueDate <= limit)
        .reduce((sum, entry) => sum + (entry.nature === EntryNature.REVENUE ? Number(entry.amount) : -Number(entry.amount)), 0);
      return { horizonDays, projectedBalance: currentBalance + delta };
    });

    return { year, companyIds, openingBalance, months, currentBalance, projection };
  }

  private async monthlyPaidTotals(companyIds: string[], year: number) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const paid = await this.prisma.financialEntry.findMany({
      where: { companyId: { in: companyIds }, status: EntryStatus.PAID, paymentDate: { gte: start, lt: end } },
      select: { paymentDate: true, amount: true, nature: true },
    });

    const entries = new Array(12).fill(0);
    const exits = new Array(12).fill(0);
    for (const entry of paid) {
      const month = entry.paymentDate!.getUTCMonth();
      const amount = Number(entry.amount);
      if (entry.nature === EntryNature.REVENUE) entries[month] += amount;
      else exits[month] += amount;
    }
    return { entries, exits };
  }

  private async monthlyExternalTransfers(companyIds: string[], year: number) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const [incoming, outgoing] = await Promise.all([
      this.prisma.accountTransfer.findMany({
        where: {
          destinationAccount: { companyId: { in: companyIds } },
          sourceAccount: { companyId: { notIn: companyIds } },
          date: { gte: start, lt: end },
        },
        select: { date: true, amount: true },
      }),
      this.prisma.accountTransfer.findMany({
        where: {
          sourceAccount: { companyId: { in: companyIds } },
          destinationAccount: { companyId: { notIn: companyIds } },
          date: { gte: start, lt: end },
        },
        select: { date: true, amount: true },
      }),
    ]);

    const transferIn = new Array(12).fill(0);
    const transferOut = new Array(12).fill(0);
    for (const transfer of incoming) transferIn[transfer.date.getUTCMonth()] += Number(transfer.amount);
    for (const transfer of outgoing) transferOut[transfer.date.getUTCMonth()] += Number(transfer.amount);
    return { transferIn, transferOut };
  }

  /** Saldo (contas bancárias + pagos + transferências externas) ANTES de `beforeDate`, ou até agora se omitido. */
  private async getBalance(companyIds: string[], beforeDate?: Date): Promise<number> {
    const paidDateFilter = beforeDate ? { lt: beforeDate } : undefined;
    const transferDateFilter = beforeDate ? { lt: beforeDate } : undefined;

    const [accounts, paidRevenue, paidExpense, transfersIn, transfersOut] = await Promise.all([
      this.prisma.bankAccount.aggregate({ where: { companyId: { in: companyIds } }, _sum: { initialBalance: true } }),
      this.prisma.financialEntry.aggregate({
        where: { companyId: { in: companyIds }, status: EntryStatus.PAID, nature: EntryNature.REVENUE, paymentDate: paidDateFilter },
        _sum: { amount: true },
      }),
      this.prisma.financialEntry.aggregate({
        where: { companyId: { in: companyIds }, status: EntryStatus.PAID, nature: EntryNature.EXPENSE, paymentDate: paidDateFilter },
        _sum: { amount: true },
      }),
      this.prisma.accountTransfer.aggregate({
        where: {
          destinationAccount: { companyId: { in: companyIds } },
          sourceAccount: { companyId: { notIn: companyIds } },
          date: transferDateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.accountTransfer.aggregate({
        where: {
          sourceAccount: { companyId: { in: companyIds } },
          destinationAccount: { companyId: { notIn: companyIds } },
          date: transferDateFilter,
        },
        _sum: { amount: true },
      }),
    ]);

    return (
      Number(accounts._sum.initialBalance ?? 0) +
      Number(paidRevenue._sum.amount ?? 0) -
      Number(paidExpense._sum.amount ?? 0) +
      Number(transfersIn._sum.amount ?? 0) -
      Number(transfersOut._sum.amount ?? 0)
    );
  }

  // ---------------------------------------------------------------------
  // Saldo por conta bancária
  // ---------------------------------------------------------------------

  async getBankBalances(companyIds: string[]) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { companyId: { in: companyIds } },
      include: { company: { select: { name: true, tradeName: true } } },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      accounts.map(async (account) => {
        const [paidRevenue, paidExpense, transfersIn, transfersOut] = await Promise.all([
          this.prisma.financialEntry.aggregate({
            where: { bankAccountId: account.id, status: EntryStatus.PAID, nature: EntryNature.REVENUE },
            _sum: { amount: true },
          }),
          this.prisma.financialEntry.aggregate({
            where: { bankAccountId: account.id, status: EntryStatus.PAID, nature: EntryNature.EXPENSE },
            _sum: { amount: true },
          }),
          this.prisma.accountTransfer.aggregate({ where: { destinationAccountId: account.id }, _sum: { amount: true } }),
          this.prisma.accountTransfer.aggregate({ where: { sourceAccountId: account.id }, _sum: { amount: true } }),
        ]);

        const totalIn = Number(paidRevenue._sum.amount ?? 0) + Number(transfersIn._sum.amount ?? 0);
        const totalOut = Number(paidExpense._sum.amount ?? 0) + Number(transfersOut._sum.amount ?? 0);
        const initialBalance = Number(account.initialBalance);

        return {
          id: account.id,
          name: account.name,
          companyId: account.companyId,
          companyName: account.company.tradeName ?? account.company.name,
          type: account.type,
          initialBalance,
          totalIn,
          totalOut,
          currentBalance: initialBalance + totalIn - totalOut,
        };
      }),
    );

    return { accounts: results, consolidatedBalance: sumArray(results.map((r) => r.currentBalance)) };
  }

  // ---------------------------------------------------------------------
  // Rentabilidade por job
  // ---------------------------------------------------------------------

  async getJobProfitability(companyIds: string[], year?: number, month?: number) {
    const where: Record<string, unknown> = { companyId: { in: companyIds } };
    if (year) {
      const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
      const end = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
      where.entryDate = { gte: start, lt: end };
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: { client: { select: { name: true } }, financialEntries: { select: { amount: true, nature: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return jobs
      .map((job) => {
        const revenue = job.financialEntries
          .filter((e) => e.nature === EntryNature.REVENUE)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const directCosts = job.financialEntries
          .filter((e) => e.nature === EntryNature.EXPENSE)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const commission = job.calculatedCommission ? Number(job.calculatedCommission) : 0;
        const margin = revenue - directCosts - commission;

        return {
          jobId: job.id,
          jobName: job.name,
          clientName: job.client?.name ?? null,
          revenue,
          directCosts,
          commission,
          margin,
          marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.margin - a.margin);
  }

  // ---------------------------------------------------------------------
  // Relatório de clientes / fornecedores (regime de caixa, por mês)
  // ---------------------------------------------------------------------

  async getClientsReport(companyIds: string[], year: number) {
    return this.getPartyReport(companyIds, year, 'client');
  }

  async getSuppliersReport(companyIds: string[], year: number) {
    return this.getPartyReport(companyIds, year, 'supplier');
  }

  private async getPartyReport(companyIds: string[], year: number, party: 'client' | 'supplier') {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const nature = party === 'client' ? EntryNature.REVENUE : EntryNature.EXPENSE;
    const idField = party === 'client' ? 'clientId' : 'supplierId';

    const paid = await this.prisma.financialEntry.findMany({
      where: {
        companyId: { in: companyIds },
        status: EntryStatus.PAID,
        nature,
        paymentDate: { gte: start, lt: end },
        [idField]: { not: null },
      },
      select: {
        paymentDate: true,
        amount: true,
        client: party === 'client' ? { select: { id: true, name: true } } : false,
        supplier: party === 'supplier' ? { select: { id: true, name: true } } : false,
      },
    });

    const byParty = new Map<string, { id: string; name: string; months: number[] }>();
    for (const entry of paid) {
      const target = party === 'client' ? entry.client : entry.supplier;
      if (!target) continue;
      if (!byParty.has(target.id)) {
        byParty.set(target.id, { id: target.id, name: target.name, months: new Array(12).fill(0) });
      }
      byParty.get(target.id)!.months[entry.paymentDate!.getUTCMonth()] += Number(entry.amount);
    }

    return Array.from(byParty.values())
      .map((row) => ({ ...row, total: sumArray(row.months) }))
      .sort((a, b) => b.total - a.total);
  }

  // ---------------------------------------------------------------------
  // Contas a pagar/receber — dashboard de vencimentos
  // ---------------------------------------------------------------------

  async getAccountsPayableSummary(companyIds: string[], nature: EntryNature = EntryNature.EXPENSE) {
    const today = startOfDayUTC(new Date());
    const endOfWeek = addDaysUTC(today, 7);
    const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

    const pending = await this.prisma.financialEntry.findMany({
      where: { companyId: { in: companyIds }, status: EntryStatus.PENDING, nature },
      select: {
        amount: true,
        dueDate: true,
        costCenterId: true,
        costCenter: { select: { name: true } },
        supplierId: true,
        supplier: { select: { name: true } },
        clientId: true,
        client: { select: { name: true } },
      },
    });

    const bucket = (predicate: (dueDate: Date) => boolean) => {
      const items = pending.filter((e) => predicate(e.dueDate));
      return { count: items.length, total: sumArray(items.map((e) => Number(e.amount))) };
    };

    const byCostCenter = new Map<string, { costCenterId: string; name: string; total: number }>();
    const byParty = new Map<string, { id: string; name: string; total: number }>();
    for (const entry of pending) {
      const costCenterKey = entry.costCenterId;
      if (!byCostCenter.has(costCenterKey)) {
        byCostCenter.set(costCenterKey, { costCenterId: costCenterKey, name: entry.costCenter.name, total: 0 });
      }
      byCostCenter.get(costCenterKey)!.total += Number(entry.amount);

      const party = nature === EntryNature.EXPENSE ? entry.supplier : entry.client;
      const partyId = nature === EntryNature.EXPENSE ? entry.supplierId : entry.clientId;
      if (party && partyId) {
        if (!byParty.has(partyId)) {
          byParty.set(partyId, { id: partyId, name: party.name, total: 0 });
        }
        byParty.get(partyId)!.total += Number(entry.amount);
      }
    }

    return {
      nature,
      totalOpen: { count: pending.length, total: sumArray(pending.map((e) => Number(e.amount))) },
      overdue: bucket((dueDate) => dueDate < today),
      dueToday: bucket((dueDate) => dueDate.getTime() === today.getTime()),
      dueThisWeek: bucket((dueDate) => dueDate >= today && dueDate <= endOfWeek),
      dueThisMonth: bucket((dueDate) => dueDate >= today && dueDate < endOfMonth),
      byCostCenter: Array.from(byCostCenter.values()).sort((a, b) => b.total - a.total),
      byParty: Array.from(byParty.values()).sort((a, b) => b.total - a.total),
    };
  }

  // ---------------------------------------------------------------------
  // Ranking de comissões
  // ---------------------------------------------------------------------

  async getCommissionRanking(companyIds: string[], year?: number, month?: number) {
    const where: Record<string, unknown> = { companyId: { in: companyIds }, responsibleEmployeeId: { not: null } };
    if (year) {
      const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
      const end = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));
      where.entryDate = { gte: start, lt: end };
    }

    const jobs = await this.prisma.job.findMany({
      where,
      select: {
        responsibleEmployeeId: true,
        responsibleEmployee: { select: { name: true } },
        calculatedCommission: true,
        result: true,
      },
    });

    const byEmployee = new Map<string, { employeeId: string; employeeName: string; jobsCount: number; successCount: number; totalCommission: number }>();
    for (const job of jobs) {
      const employeeId = job.responsibleEmployeeId!;
      if (!byEmployee.has(employeeId)) {
        byEmployee.set(employeeId, {
          employeeId,
          employeeName: job.responsibleEmployee!.name,
          jobsCount: 0,
          successCount: 0,
          totalCommission: 0,
        });
      }
      const row = byEmployee.get(employeeId)!;
      row.jobsCount += 1;
      if (job.result === JobResult.GANHOU_COM_SUCCESS) row.successCount += 1;
      row.totalCommission += job.calculatedCommission ? Number(job.calculatedCommission) : 0;
    }

    return Array.from(byEmployee.values()).sort((a, b) => b.totalCommission - a.totalCommission);
  }
}
