import * as XLSX from 'xlsx';
import { BankAccountType } from '@prisma/client';
import { normalizeKey, toTrimmedString } from './xlsx-utils';
import { resolveCompanyByCentroDeCusto, isInvestmentCentroDeCusto } from './company-resolution';
import type { ImportContext } from './types';
import { ImportReport } from './types';

/**
 * "Saldo bancos" nomeia, na verdade, as MESMAS chaves usadas como "Centro de
 * custo" em Lançamentos (Ambiens/Smart/IGH = conta corrente da empresa;
 * "Aplicação X"/"Renda Fixa" = aplicação). Confirmamos por reconciliação
 * manual que os saldos desta aba são 100% derivados da soma dos Lançamentos
 * pagos — por isso toda conta importada nasce com initialBalance = 0: o
 * próprio histórico de lançamentos (importado a seguir, já linkado por
 * bankAccountId) reconstrói o saldo idêntico ao da planilha original.
 */
export async function importBankAccounts(ctx: ImportContext, workbook: XLSX.WorkBook): Promise<ImportReport> {
  const report = new ImportReport('Saldo bancos');
  const sheet = workbook.Sheets['Saldo bancos'];
  if (!sheet) {
    report.error('Aba "Saldo bancos" não encontrada.');
    return report;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRowIndex = rows.findIndex((row) => row.includes('Bancos'));
  if (headerRowIndex === -1) {
    report.error('Não encontrei a coluna "Bancos".');
    return report;
  }
  const bancosCol = rows[headerRowIndex].indexOf('Bancos');

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const name = toTrimmedString(rows[r]?.[bancosCol] ?? null);
    if (!name || name === '-') continue;
    report.processed++;

    const resolution = resolveCompanyByCentroDeCusto(ctx, name);
    if (!resolution) {
      report.warn(`Conta "${name}": não consegui identificar a empresa dona — pulei.`);
      report.skipped++;
      continue;
    }
    if (resolution.assumed) {
      report.warn(`Conta "${name}": planilha não indica a empresa dona; atribuída a Ambiens por padrão (revisar depois).`);
    }

    const cacheKey = `${resolution.companyId}|${normalizeKey(name)}`;
    if (ctx.bankAccountByCompanyAndName.has(cacheKey)) {
      report.skipped++;
      continue;
    }

    const type = isInvestmentCentroDeCusto(name) ? BankAccountType.INVESTMENT : BankAccountType.CHECKING;

    if (ctx.dryRun) {
      ctx.bankAccountByCompanyAndName.set(cacheKey, `dry-run:${name}`);
      report.created++;
      continue;
    }

    const created = await ctx.prisma.bankAccount.create({
      data: { companyId: resolution.companyId, name, type, initialBalance: 0 },
    });
    ctx.bankAccountByCompanyAndName.set(cacheKey, created.id);
    report.created++;
  }

  return report;
}
