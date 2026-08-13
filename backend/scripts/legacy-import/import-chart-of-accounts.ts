import * as XLSX from 'xlsx';
import { ChartAccountGroup } from '@prisma/client';
import { CADASTRO_CONTAS_GROUP_COLUMNS } from './mappings';
import { normalizeKey, toTrimmedString } from './xlsx-utils';
import type { ImportContext } from './types';
import { ImportReport } from './types';

/**
 * "Cadastro de contas" não é um cadastro de contas bancárias — é a lista de
 * subcategorias do plano de contas, uma coluna por grupo (Receitas, Custo
 * Fixo, ...). Cada nome vira uma linha em ChartOfAccount; os que já existem
 * (criados pelo seed) são apenas linkados no cache, nada é duplicado.
 */
export async function importChartOfAccounts(ctx: ImportContext, workbook: XLSX.WorkBook): Promise<ImportReport> {
  const report = new ImportReport('Cadastro de contas');
  const sheet = workbook.Sheets['Cadastro de contas'];
  if (!sheet) {
    report.error('Aba "Cadastro de contas" não encontrada.');
    return report;
  }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRowIndex = rows.findIndex((row) => row.some((cell) => cell === 'Receitas'));
  if (headerRowIndex === -1) {
    report.error('Não encontrei a linha de cabeçalho dos grupos do plano de contas.');
    return report;
  }
  const headerRow = rows[headerRowIndex];

  const groupRoots = await ctx.prisma.chartOfAccount.findMany({ where: { parentId: null } });
  const rootIdByGroup = new Map(groupRoots.map((root) => [root.group, root.id]));

  for (const [columnLabel, group] of Object.entries(CADASTRO_CONTAS_GROUP_COLUMNS)) {
    const columnIndex = headerRow.findIndex((cell) => cell === columnLabel);
    if (columnIndex === -1) {
      report.warn(`Coluna do grupo "${columnLabel}" não encontrada na aba.`);
      continue;
    }
    const rootId = rootIdByGroup.get(group);
    if (!rootId) {
      report.error(`Grupo raiz "${group}" não existe no banco (rode o seed antes de importar).`);
      continue;
    }

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const raw = toTrimmedString(rows[r]?.[columnIndex] ?? null);
      if (!raw) continue;
      report.processed++;

      const cacheKey = `${group}|${normalizeKey(raw)}`;
      if (ctx.chartOfAccountByGroupAndName.has(cacheKey)) {
        report.skipped++;
        continue;
      }

      if (ctx.dryRun) {
        report.created++;
        ctx.chartOfAccountByGroupAndName.set(cacheKey, `dry-run:${raw}`);
        continue;
      }

      const created = await ctx.prisma.chartOfAccount.create({
        data: { name: raw, group, parentId: rootId },
      });
      ctx.chartOfAccountByGroupAndName.set(cacheKey, created.id);
      report.created++;
    }
  }

  return report;
}

export function resolveChartOfAccountId(ctx: ImportContext, group: ChartAccountGroup, name: string): string | null {
  return ctx.chartOfAccountByGroupAndName.get(`${group}|${normalizeKey(name)}`) ?? null;
}
