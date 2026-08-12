/**
 * Importa os dados históricos de CONTROLE_FINANCEIRO_AMBIENS.xlsm para o
 * banco novo. Ver docs/IMPORTACAO_PLANILHA.md para o mapeamento completo de
 * cada aba/coluna e as decisões tomadas para dados que não têm equivalente
 * exato no nosso schema.
 *
 * Uso:
 *   npx ts-node scripts/import-legacy-spreadsheet.ts --file /caminho/CONTROLE_FINANCEIRO_AMBIENS.xlsm [--dry-run] [--imported-by-email admin@ambiens.com.br]
 *
 * SEMPRE rode com --dry-run primeiro: ele faz todo o parsing/mapeamento e
 * imprime o relatório completo (o que seria criado, os avisos de
 * aproximação, o que foi pulado) sem gravar nada no banco.
 */
import { PrismaClient } from '@prisma/client';
import { buildImportContext } from './legacy-import/bootstrap';
import { loadWorkbook } from './legacy-import/xlsx-utils';
import { importChartOfAccounts } from './legacy-import/import-chart-of-accounts';
import { importBankAccounts } from './legacy-import/import-bank-accounts';
import { loadClientEnrichment, importEmployees } from './legacy-import/import-cadastros';
import { importLancamentos } from './legacy-import/import-lancamentos';
import { importJobs } from './legacy-import/import-acompanhamento';
import type { ImportReport } from './legacy-import/types';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  const filePath = get('--file');
  if (!filePath) {
    throw new Error('Uso: --file <caminho para CONTROLE_FINANCEIRO_AMBIENS.xlsm> [--dry-run] [--imported-by-email <email>]');
  }
  return {
    filePath,
    dryRun: args.includes('--dry-run'),
    importedByEmail: get('--imported-by-email') ?? 'admin@ambiens.com.br',
  };
}

function printReport(report: ImportReport) {
  console.log(`\n${report.summary()}`);
  for (const warning of report.warnings) console.log(`  [aviso] ${warning}`);
  for (const error of report.errors) console.log(`  [ERRO] ${error}`);
}

async function saveImportBatch(prisma: PrismaClient, fileName: string, importedByUserId: string, report: ImportReport) {
  await prisma.importBatch.create({
    data: {
      fileName,
      sourceSheet: report.sheet,
      importedByUserId,
      status: report.errors.length > 0 ? 'FAILED' : 'SUCCESS',
      rowsProcessed: report.processed,
      rowsFailed: report.errors.length,
      errorLog: [...report.warnings.map((w) => `[aviso] ${w}`), ...report.errors.map((e) => `[erro] ${e}`)].join('\n') || null,
      finishedAt: new Date(),
    },
  });
}

async function main() {
  const { filePath, dryRun, importedByEmail } = parseArgs();
  console.log(`Lendo ${filePath}${dryRun ? ' (DRY RUN — nada será gravado no banco)' : ''}...`);

  const prisma = new PrismaClient();
  try {
    const workbook = loadWorkbook(filePath);
    const ctx = await buildImportContext(prisma, importedByEmail, dryRun);

    const reports: ImportReport[] = [];

    reports.push(await importChartOfAccounts(ctx, workbook));
    reports.push(await importBankAccounts(ctx, workbook));
    reports.push(loadClientEnrichment(ctx, workbook));
    reports.push(await importEmployees(ctx, workbook));
    reports.push(await importLancamentos(ctx, workbook));
    reports.push(await importJobs(ctx, workbook));

    for (const report of reports) {
      printReport(report);
      if (!dryRun) {
        await saveImportBatch(prisma, filePath, ctx.importedByUserId, report);
      }
    }

    const totalCreated = reports.reduce((sum, r) => sum + r.created, 0);
    const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);
    console.log(
      `\n===== Resumo${dryRun ? ' (dry run)' : ''}: ${totalCreated} registros ${dryRun ? 'seriam criados' : 'criados'}, ${totalWarnings} avisos, ${totalErrors} erros =====`,
    );
    if (dryRun) {
      console.log('Nenhuma alteração foi gravada no banco. Revise os avisos acima e rode sem --dry-run quando estiver tudo certo.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
