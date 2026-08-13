import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { ChartAccountGroup, EntryNature, EntryStatus } from '@prisma/client';
import { getCompetence } from '../../src/financial-entries/date.util';
import { normalizeKey, readSheetRows, toDate, toNumber, toTrimmedString } from './xlsx-utils';
import { mapEntryGroup } from './mappings';
import { resolveCompanyByCentroDeCusto } from './company-resolution';
import { resolveChartOfAccountId } from './import-chart-of-accounts';
import type { ImportContext } from './types';
import { ImportReport } from './types';

interface PreparedEntry {
  companyId: string;
  costCenterId: string;
  chartOfAccountId: string;
  bankAccountId: string | null;
  clientId: string | null;
  nature: EntryNature;
  invoiceNumber: string | null;
  description: string;
  amount: number;
  entryDate: Date;
  dueDate: Date;
  paymentDate: Date | null;
  situacao: string | null;
  groupKey: string;
  parcelaNumero: number | null;
}

interface TransferRow {
  direction: 'IN' | 'OUT';
  centroDeCusto: string;
  description: string;
  amount: number;
  date: Date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function findOrCreateClient(ctx: ImportContext, companyId: string, name: string): Promise<string> {
  const cacheKey = `${companyId}|${normalizeKey(name)}`;
  const cached = ctx.clientByCompanyAndName.get(cacheKey);
  if (cached) return cached;

  const enrichment = ctx.clientEnrichmentByName.get(normalizeKey(name));
  if (ctx.dryRun) {
    const fakeId = `dry-run:${name}`;
    ctx.clientByCompanyAndName.set(cacheKey, fakeId);
    return fakeId;
  }

  const created = await ctx.prisma.client.create({
    data: {
      companyId,
      name,
      email: enrichment?.email ?? null,
      phone: enrichment?.phone ?? null,
      address: enrichment?.address ?? null,
      document: enrichment?.document ?? null,
    },
  });
  ctx.clientByCompanyAndName.set(cacheKey, created.id);
  return created.id;
}

async function pairAndCreateTransfers(ctx: ImportContext, report: ImportReport, transferRows: TransferRow[]) {
  const outs = transferRows.filter((t) => t.direction === 'OUT');
  const ins = transferRows.filter((t) => t.direction === 'IN');
  const usedIns = new Set<number>();

  for (const out of outs) {
    const matchIndex = ins.findIndex(
      (candidate, i) => !usedIns.has(i) && candidate.amount === out.amount && isSameDay(candidate.date, out.date),
    );
    if (matchIndex === -1) {
      report.warn(
        `Transferência de saída "${out.description}" (${out.centroDeCusto}, R$ ${out.amount.toFixed(2)}, ${formatDate(out.date)}) sem par de entrada correspondente — pulei.`,
      );
      report.skipped++;
      continue;
    }
    usedIns.add(matchIndex);
    const inRow = ins[matchIndex];

    const sourceRes = resolveCompanyByCentroDeCusto(ctx, out.centroDeCusto);
    const destRes = resolveCompanyByCentroDeCusto(ctx, inRow.centroDeCusto);
    const sourceAccountId = sourceRes && ctx.bankAccountByCompanyAndName.get(`${sourceRes.companyId}|${normalizeKey(out.centroDeCusto)}`);
    const destAccountId = destRes && ctx.bankAccountByCompanyAndName.get(`${destRes.companyId}|${normalizeKey(inRow.centroDeCusto)}`);
    if (!sourceAccountId || !destAccountId) {
      report.warn(`Transferência "${out.description}" (${formatDate(out.date)}): conta de origem ou destino não encontrada — pulei.`);
      report.skipped++;
      continue;
    }

    report.processed++;
    if (ctx.dryRun) {
      report.created++;
      continue;
    }
    await ctx.prisma.accountTransfer.create({
      data: {
        date: out.date,
        amount: out.amount,
        sourceAccountId,
        destinationAccountId: destAccountId,
        description: out.description,
        createdByUserId: ctx.importedByUserId,
      },
    });
    report.created++;
  }

  ins.forEach((inRow, i) => {
    if (!usedIns.has(i)) {
      report.warn(
        `Transferência de entrada "${inRow.description}" (${inRow.centroDeCusto}, R$ ${inRow.amount.toFixed(2)}, ${formatDate(inRow.date)}) sem par de saída correspondente — pulei.`,
      );
      report.skipped++;
    }
  });
}

async function persistEntries(ctx: ImportContext, report: ImportReport, entries: PreparedEntry[]) {
  const groups = new Map<string, PreparedEntry[]>();
  for (const entry of entries) {
    if (!groups.has(entry.groupKey)) groups.set(entry.groupKey, []);
    groups.get(entry.groupKey)!.push(entry);
  }

  for (const group of groups.values()) {
    const installmentTotal = group.length;
    const installmentGroupId = installmentTotal > 1 ? randomUUID() : null;
    const sorted = [...group].sort((a, b) => {
      if (a.parcelaNumero !== null && b.parcelaNumero !== null) return a.parcelaNumero - b.parcelaNumero;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const installmentNumber = entry.parcelaNumero ?? i + 1;
      const status = entry.paymentDate ? EntryStatus.PAID : EntryStatus.PENDING;
      const competence = getCompetence(entry.entryDate);
      const due = getCompetence(entry.dueDate);

      if (ctx.dryRun) {
        report.created++;
        continue;
      }

      await ctx.prisma.financialEntry.create({
        data: {
          companyId: entry.companyId,
          clientId: entry.clientId,
          supplierId: null,
          costCenterId: entry.costCenterId,
          chartOfAccountId: entry.chartOfAccountId,
          bankAccountId: entry.bankAccountId,
          nature: entry.nature,
          invoiceNumber: entry.invoiceNumber,
          description: entry.description,
          amount: entry.amount,
          installmentGroupId: installmentGroupId ?? undefined,
          installmentNumber,
          installmentTotal,
          entryDate: entry.entryDate,
          dueDate: entry.dueDate,
          paymentDate: entry.paymentDate,
          status,
          situacao: entry.situacao,
          competenceMonth: competence.month,
          competenceYear: competence.year,
          dueMonth: due.month,
          dueYear: due.year,
          createdByUserId: ctx.importedByUserId,
        },
      });
      report.created++;
    }
  }
}

export async function importLancamentos(ctx: ImportContext, workbook: XLSX.WorkBook): Promise<ImportReport> {
  const report = new ImportReport('Lançamentos');
  if (!workbook.Sheets['Lançamentos']) {
    report.error('Aba "Lançamentos" não encontrada.');
    return report;
  }

  const rows = readSheetRows(workbook, 'Lançamentos', 'Descrição');
  const transferRows: TransferRow[] = [];
  const preparedEntries: PreparedEntry[] = [];

  let rowIndex = 0;
  for (const row of rows) {
    rowIndex++;
    report.processed++;
    const description = toTrimmedString(row['Descrição']) ?? '(sem descrição)';
    try {
      const tipoRaw = toTrimmedString(row['Tipo']);
      if (!tipoRaw) {
        report.warn(`Linha "${description}": Tipo ausente — pulei.`);
        report.skipped++;
        continue;
      }

      // Linhas de comissão/salário ligadas a jobs e algumas receitas
      // negociadas costumam não preencher "Centro de custo" na planilha
      // (73 das 2702 linhas reais) — todas têm "Tipo" e valores válidos, só
      // falta a coluna que amarra a linha a uma empresa. Mesma aproximação
      // já usada para "Aplicação Geral"/"Renda Fixa" em company-resolution.ts:
      // caem em Ambiens (empresa "titular" do arquivo), sinalizado no relatório.
      const centroDeCustoRaw = toTrimmedString(row['Centro de custo']);
      const centroDeCusto = centroDeCustoRaw ?? 'Ambiens';
      if (!centroDeCustoRaw) {
        report.warn(`Linha "${description}": Centro de custo ausente na planilha; atribuída a Ambiens por padrão (revisar depois).`);
      }

      const amount = toNumber(row['Valor']);
      const entryDate = toDate(row['Data de entrada']);
      const dueDate = toDate(row['Data de vencimento']) ?? entryDate;
      const paymentDate = toDate(row['Data de pagamento']);
      if (amount === null || amount <= 0 || !entryDate || !dueDate) {
        report.warn(`Linha "${description}": valor ou datas inválidas — pulei.`);
        report.skipped++;
        continue;
      }

      const normTipo = normalizeKey(tipoRaw);
      const isTransferType = normTipo === 'TRASF.SAIDA' || normTipo === 'TRASF.ENTRADA';
      const isPairableTransfer = isTransferType && normalizeKey(description) === 'TRANSFERENCIA ENTRE CONTAS';

      if (isPairableTransfer) {
        transferRows.push({
          direction: normTipo === 'TRASF.ENTRADA' ? 'IN' : 'OUT',
          centroDeCusto,
          description,
          amount,
          date: paymentDate ?? dueDate,
        });
        continue;
      }

      const resolution = resolveCompanyByCentroDeCusto(ctx, centroDeCusto);
      if (!resolution) {
        report.warn(`Linha "${description}": centro de custo "${centroDeCusto}" não reconhecido — pulei.`);
        report.skipped++;
        continue;
      }

      let group: ChartAccountGroup | null;
      let categoryName: string;
      if (isTransferType) {
        // Transferência sem par (ex.: "Ajuste de conta") — não dá pra modelar
        // como AccountTransfer sem os dois lados. Vira lançamento normal em
        // Outras Receitas/Outras Despesas, preservando o efeito no saldo.
        group = normTipo === 'TRASF.ENTRADA' ? ChartAccountGroup.RECEITA : ChartAccountGroup.DESPESA_VARIAVEL;
        categoryName = normTipo === 'TRASF.ENTRADA' ? 'Outras Receitas' : 'Outras Despesas';
        report.warn(`Linha "${description}" (${centroDeCusto}): sem transferência par — importada como lançamento em "${categoryName}".`);
      } else {
        group = mapEntryGroup(tipoRaw);
        categoryName = toTrimmedString(row['Plano de contas']) ?? '';
      }

      if (!group) {
        report.warn(`Linha "${description}": tipo "${tipoRaw}" não reconhecido — pulei.`);
        report.skipped++;
        continue;
      }

      const chartOfAccountId = resolveChartOfAccountId(ctx, group, categoryName);
      if (!chartOfAccountId) {
        report.warn(`Linha "${description}": categoria "${categoryName}" (grupo ${group}) não encontrada — pulei.`);
        report.skipped++;
        continue;
      }

      const costCenterId = ctx.generalCostCenterByCompany.get(resolution.companyId);
      if (!costCenterId) {
        report.error(`Linha "${description}": empresa sem centro de custo "Geral" cadastrado — pulei.`);
        report.skipped++;
        continue;
      }

      const bankAccountId =
        ctx.bankAccountByCompanyAndName.get(`${resolution.companyId}|${normalizeKey(centroDeCusto)}`) ?? null;

      const nature = group === ChartAccountGroup.RECEITA ? EntryNature.REVENUE : EntryNature.EXPENSE;

      let clientId: string | null = null;
      if (nature === EntryNature.REVENUE) {
        const clienteName = toTrimmedString(row['Cliente']);
        if (clienteName) {
          clientId = await findOrCreateClient(ctx, resolution.companyId, clienteName);
        }
      }

      const invoiceNumberRaw = row['N°f'];
      const invoiceNumber =
        invoiceNumberRaw === null || invoiceNumberRaw === undefined || invoiceNumberRaw === '' ? null : String(invoiceNumberRaw);

      const parcelaNumero = toNumber(row['N° parcelas']);
      // Só agrupamos como parcelamento quando a própria planilha preenche
      // "N° parcelas" explicitamente (78 das 2698 linhas reais). Sem esse
      // sinal, linhas com Cliente/Descrição/Tipo/Centro de custo iguais mas
      // datas/valores diferentes normalmente são lançamentos recorrentes
      // não relacionados (ex.: salário mensal, "Aplicação financeira"
      // genérica) — cada uma vira seu próprio grupo de tamanho 1 usando o
      // índice da linha como sufixo único.
      const groupKey =
        parcelaNumero !== null
          ? `${normalizeKey(toTrimmedString(row['Cliente']) ?? '')}|${normalizeKey(description)}|${tipoRaw}|${centroDeCusto}`
          : `SINGLE|${rowIndex}`;

      preparedEntries.push({
        companyId: resolution.companyId,
        costCenterId,
        chartOfAccountId,
        bankAccountId,
        clientId,
        nature,
        invoiceNumber,
        description,
        amount,
        entryDate,
        dueDate,
        paymentDate,
        situacao: toTrimmedString(row['situação']),
        groupKey,
        parcelaNumero,
      });
    } catch (error) {
      report.error(`Linha "${description}": ${(error as Error).message}`);
    }
  }

  await pairAndCreateTransfers(ctx, report, transferRows);
  await persistEntries(ctx, report, preparedEntries);

  return report;
}
