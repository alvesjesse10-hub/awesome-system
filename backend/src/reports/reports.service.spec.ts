import { ChartAccountGroup, EntryNature, EntryStatus, JobResult, SaleType } from '@prisma/client';
import { ReportsService } from './reports.service';
import {
  cleanupCompany,
  cleanupUser,
  createBankAccount,
  createChartOfAccount,
  createCostCenter,
  createTestCompany,
  createTestUser,
  prisma,
  utcDate,
} from '../test-utils/fixtures';
import { addDaysUTC, startOfDayUTC } from './report-math.util';

describe('ReportsService (integração)', () => {
  const service = new ReportsService(prisma);

  let companyId: string;
  let userId: string;
  let costCenterId: string;
  let receitaId: string;
  let custoFixoId: string;
  let despesaVariavelId: string;
  let bonificacaoId: string;

  beforeAll(async () => {
    companyId = await createTestCompany('reports');
    userId = await createTestUser('reports');
    costCenterId = await createCostCenter(companyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços de teste');
    custoFixoId = await createChartOfAccount(ChartAccountGroup.CUSTO_FIXO, 'Aluguel de teste');
    despesaVariavelId = await createChartOfAccount(ChartAccountGroup.DESPESA_VARIAVEL, 'Imposto de teste');
    bonificacaoId = await createChartOfAccount(ChartAccountGroup.BONIFICACAO, 'Bônus de teste');
  });

  afterAll(async () => {
    await cleanupCompany(companyId, [receitaId, custoFixoId, despesaVariavelId, bonificacaoId]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  async function createEntry(opts: {
    chartOfAccountId: string;
    nature: EntryNature;
    amount: number;
    entryDate: Date;
    dueDate?: Date;
    status?: EntryStatus;
    paymentDate?: Date | null;
    bankAccountId?: string;
    jobId?: string;
    clientId?: string;
    supplierId?: string;
  }) {
    return prisma.financialEntry.create({
      data: {
        companyId,
        costCenterId,
        chartOfAccountId: opts.chartOfAccountId,
        nature: opts.nature,
        description: 'Lançamento de teste',
        amount: opts.amount,
        entryDate: opts.entryDate,
        dueDate: opts.dueDate ?? opts.entryDate,
        status: opts.status ?? EntryStatus.PENDING,
        paymentDate: opts.paymentDate ?? null,
        bankAccountId: opts.bankAccountId,
        jobId: opts.jobId,
        clientId: opts.clientId,
        supplierId: opts.supplierId,
        competenceMonth: opts.entryDate.getUTCMonth() + 1,
        competenceYear: opts.entryDate.getUTCFullYear(),
        dueMonth: (opts.dueDate ?? opts.entryDate).getUTCMonth() + 1,
        dueYear: (opts.dueDate ?? opts.entryDate).getUTCFullYear(),
        createdByUserId: userId,
      },
    });
  }

  describe('getDre', () => {
    it('agrupa por competência (entryDate) e calcula Resultado Operacional e Resultado Final', async () => {
      const year = 2031;
      await createEntry({ chartOfAccountId: receitaId, nature: EntryNature.REVENUE, amount: 10000, entryDate: utcDate(year, 3, 5) });
      await createEntry({ chartOfAccountId: custoFixoId, nature: EntryNature.EXPENSE, amount: 3000, entryDate: utcDate(year, 3, 10) });
      await createEntry({ chartOfAccountId: despesaVariavelId, nature: EntryNature.EXPENSE, amount: 1000, entryDate: utcDate(year, 3, 12) });
      await createEntry({ chartOfAccountId: bonificacaoId, nature: EntryNature.EXPENSE, amount: 500, entryDate: utcDate(year, 3, 15) });
      // Paga em abril mas com competência em março (paymentDate não deve influenciar o DRE, só entryDate)
      await createEntry({
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        amount: 2000,
        entryDate: utcDate(year, 3, 20),
        status: EntryStatus.PAID,
        paymentDate: utcDate(year, 4, 2),
      });

      const dre = await service.getDre([companyId], year);

      const row = (key: string) => dre.rows.find((r) => r.key === key)!;
      expect(row('RECEITA').months[2]).toBe(12000); // março = índice 2
      expect(row('CUSTO_FIXO').months[2]).toBe(3000);
      expect(row('DESPESA_VARIAVEL').months[2]).toBe(1000);
      expect(row('BONIFICACAO').months[2]).toBe(500);
      // Resultado Operacional = receita - (custo fixo + despesa fixa + custo variável + despesa variável)
      expect(row('RESULTADO_OPERACIONAL').months[2]).toBe(12000 - 3000 - 1000);
      // Resultado Final = Resultado Operacional - Bonificação
      expect(row('RESULTADO_FINAL').months[2]).toBe(12000 - 3000 - 1000 - 500);
      expect(row('RECEITA').total).toBe(row('RECEITA').months.reduce((a, b) => a + b, 0));
    });
  });

  describe('getBankBalances', () => {
    it('saldo = initialBalance + receitas pagas − despesas pagas + transferências recebidas − enviadas', async () => {
      const bankId = await createBankAccount(companyId, `Conta saldo ${Date.now()}`, 1000);
      await createEntry({
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        amount: 5000,
        entryDate: utcDate(2031, 1, 1),
        status: EntryStatus.PAID,
        paymentDate: utcDate(2031, 1, 5),
        bankAccountId: bankId,
      });
      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 1200,
        entryDate: utcDate(2031, 1, 1),
        status: EntryStatus.PAID,
        paymentDate: utcDate(2031, 1, 6),
        bankAccountId: bankId,
      });
      // Pendente não deve entrar no saldo
      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 999999,
        entryDate: utcDate(2031, 1, 1),
        status: EntryStatus.PENDING,
        bankAccountId: bankId,
      });

      const { accounts } = await service.getBankBalances([companyId]);
      const account = accounts.find((a) => a.id === bankId)!;
      expect(account.currentBalance).toBe(1000 + 5000 - 1200);
    });
  });

  describe('getCashFlow', () => {
    it('projeção de 30/60/90 dias inclui contas pendentes já vencidas (sem limite inferior de data)', async () => {
      const year = new Date().getUTCFullYear();
      const bankId = await createBankAccount(companyId, `Conta fluxo ${Date.now()}`, 0);
      const today = startOfDayUTC(new Date());
      const overdue = addDaysUTC(today, -10);

      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 700,
        entryDate: overdue,
        dueDate: overdue,
        status: EntryStatus.PENDING,
        bankAccountId: bankId,
      });

      const before = await service.getCashFlow([companyId], year);
      const beforeProjection30 = before.projection.find((p) => p.horizonDays === 30)!.projectedBalance;

      // Remove e confere que a projeção sobe exatamente o valor da conta atrasada quando ela some
      await prisma.financialEntry.deleteMany({ where: { companyId, bankAccountId: bankId, amount: 700 } });
      const after = await service.getCashFlow([companyId], year);
      const afterProjection30 = after.projection.find((p) => p.horizonDays === 30)!.projectedBalance;

      expect(afterProjection30 - beforeProjection30).toBe(700);
    });
  });

  describe('getJobProfitability', () => {
    it('margem = receita − custos diretos − comissão, ordenado por margem decrescente', async () => {
      const jobA = await prisma.job.create({
        data: {
          companyId,
          name: `Job rentável ${Date.now()}`,
          calculatedCommission: 100,
          entryDate: utcDate(2032, 5, 1),
          createdByUserId: userId,
        },
      });
      const jobB = await prisma.job.create({
        data: {
          companyId,
          name: `Job apertado ${Date.now()}`,
          calculatedCommission: 50,
          entryDate: utcDate(2032, 5, 1),
          createdByUserId: userId,
        },
      });

      await createEntry({ chartOfAccountId: receitaId, nature: EntryNature.REVENUE, amount: 10000, entryDate: utcDate(2032, 5, 1), jobId: jobA.id });
      await createEntry({ chartOfAccountId: custoFixoId, nature: EntryNature.EXPENSE, amount: 2000, entryDate: utcDate(2032, 5, 1), jobId: jobA.id });

      await createEntry({ chartOfAccountId: receitaId, nature: EntryNature.REVENUE, amount: 1000, entryDate: utcDate(2032, 5, 1), jobId: jobB.id });
      await createEntry({ chartOfAccountId: custoFixoId, nature: EntryNature.EXPENSE, amount: 900, entryDate: utcDate(2032, 5, 1), jobId: jobB.id });

      const result = await service.getJobProfitability([companyId], 2032, 5);
      const rowA = result.find((r) => r.jobId === jobA.id)!;
      const rowB = result.find((r) => r.jobId === jobB.id)!;

      expect(rowA.margin).toBe(10000 - 2000 - 100);
      expect(rowA.marginPercent).toBeCloseTo(((10000 - 2000 - 100) / 10000) * 100);
      expect(rowB.margin).toBe(1000 - 900 - 50);
      expect(result.indexOf(rowA)).toBeLessThan(result.indexOf(rowB));
    });
  });

  describe('getClientsReport', () => {
    it('soma recebimentos pagos por cliente, por mês (regime de caixa)', async () => {
      const client = await prisma.client.create({ data: { companyId, name: `Cliente relatório ${Date.now()}` } });

      await createEntry({
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        amount: 3000,
        entryDate: utcDate(2033, 1, 1),
        status: EntryStatus.PAID,
        paymentDate: utcDate(2033, 2, 10),
        clientId: client.id,
      });
      await createEntry({
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        amount: 1500,
        entryDate: utcDate(2033, 1, 1),
        status: EntryStatus.PAID,
        paymentDate: utcDate(2033, 2, 20),
        clientId: client.id,
      });
      // Não pago: não deve contar
      await createEntry({
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        amount: 999999,
        entryDate: utcDate(2033, 1, 1),
        status: EntryStatus.PENDING,
        clientId: client.id,
      });

      const report = await service.getClientsReport([companyId], 2033);
      const row = report.find((r) => r.id === client.id)!;
      expect(row.months[1]).toBe(4500); // fevereiro = índice 1, regime de caixa (paymentDate)
      expect(row.total).toBe(4500);
    });
  });

  describe('getAccountsPayableSummary', () => {
    it('classifica pendências em atrasado / hoje / esta semana / este mês, e agrega por centro de custo e fornecedor', async () => {
      const supplier = await prisma.supplier.create({ data: { companyId, name: `Fornecedor teste ${Date.now()}` } });
      const today = startOfDayUTC(new Date());

      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 100,
        entryDate: today,
        dueDate: addDaysUTC(today, -5),
        status: EntryStatus.PENDING,
        supplierId: supplier.id,
      });
      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 200,
        entryDate: today,
        dueDate: today,
        status: EntryStatus.PENDING,
        supplierId: supplier.id,
      });
      await createEntry({
        chartOfAccountId: custoFixoId,
        nature: EntryNature.EXPENSE,
        amount: 300,
        entryDate: today,
        dueDate: addDaysUTC(today, 3),
        status: EntryStatus.PENDING,
        supplierId: supplier.id,
      });

      const summary = await service.getAccountsPayableSummary([companyId], EntryNature.EXPENSE);
      expect(summary.overdue.total).toBeGreaterThanOrEqual(100);
      expect(summary.dueToday.total).toBeGreaterThanOrEqual(200);
      expect(summary.dueThisWeek.total).toBeGreaterThanOrEqual(300);
      const supplierRow = summary.byParty.find((p) => p.id === supplier.id)!;
      expect(supplierRow.total).toBe(600);
    });
  });

  describe('getCommissionRanking', () => {
    it('soma comissão por colaborador responsável e conta jobs ganhos com success', async () => {
      const employee = await prisma.employee.create({
        data: { companyId, name: `Comercial teste ${Date.now()}`, role: 'Comercial' },
      });

      await prisma.job.create({
        data: {
          companyId,
          name: `Job comissão A ${Date.now()}`,
          responsibleEmployeeId: employee.id,
          calculatedCommission: 300,
          result: JobResult.GANHOU_COM_SUCCESS,
          saleType: SaleType.VALOR_UNICO,
          entryDate: utcDate(2034, 6, 1),
          createdByUserId: userId,
        },
      });
      await prisma.job.create({
        data: {
          companyId,
          name: `Job comissão B ${Date.now()}`,
          responsibleEmployeeId: employee.id,
          calculatedCommission: 150,
          result: JobResult.PERDEU,
          saleType: SaleType.VALOR_UNICO,
          entryDate: utcDate(2034, 6, 5),
          createdByUserId: userId,
        },
      });

      const ranking = await service.getCommissionRanking([companyId], 2034, 6);
      const row = ranking.find((r) => r.employeeId === employee.id)!;
      expect(row.jobsCount).toBe(2);
      expect(row.successCount).toBe(1);
      expect(row.totalCommission).toBe(450);
    });
  });
});
