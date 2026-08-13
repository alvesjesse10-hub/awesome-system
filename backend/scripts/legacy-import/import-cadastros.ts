import * as XLSX from 'xlsx';
import { CommissionType } from '@prisma/client';
import { normalizeKey, readSheetRows, toNumber, toTrimmedString } from './xlsx-utils';
import type { ImportContext } from './types';
import { ImportReport } from './types';

/**
 * "Cadastro de clientes" não indica a empresa dona de cada cliente. Em vez
 * de forçar todos para uma empresa, guardamos os dados de contato num cache
 * (nome normalizado -> email/telefone/endereço/documento) e os usamos só
 * para ENRIQUECER clientes criados sob demanda durante a importação dos
 * Lançamentos (que sabem a empresa certa pelo Centro de custo da receita).
 */
export function loadClientEnrichment(ctx: ImportContext, workbook: XLSX.WorkBook): ImportReport {
  const report = new ImportReport('Cadastro de clientes (enriquecimento)');
  const sheet = workbook.Sheets['Cadastro de clientes'];
  if (!sheet) {
    report.warn('Aba "Cadastro de clientes" não encontrada — seguindo sem dados de enriquecimento.');
    return report;
  }

  const rows = readSheetRows(workbook, 'Cadastro de clientes', 'Nome');
  for (const row of rows) {
    const name = toTrimmedString(row['Nome']);
    if (!name) continue;
    report.processed++;
    ctx.clientEnrichmentByName.set(normalizeKey(name), {
      email: toTrimmedString(row['Email']),
      phone: toTrimmedString(row['Contato']),
      address: toTrimmedString(row['Endereço']),
      document: toTrimmedString(row['cpf/cnpj']),
    });
    report.created++;
  }
  return report;
}

/**
 * "Cadastro de pessoal" também não indica empresa — colaboradores importados
 * caem em Ambiens (empresa titular do arquivo); mova para outra empresa
 * depois pela tela de Colaboradores se necessário.
 *
 * O valor da coluna "Comissão" na planilha real são valores em R$ (ex.:
 * 1700, 4900), não percentuais — por isso o tipo é sempre FIXED aqui,
 * diferente do padrão PERCENTAGE usado no cadastro manual pela tela.
 */
export async function importEmployees(ctx: ImportContext, workbook: XLSX.WorkBook): Promise<ImportReport> {
  const report = new ImportReport('Cadastro de pessoal');
  if (!workbook.Sheets['Cadastro de pessoal']) {
    report.error('Aba "Cadastro de pessoal" não encontrada.');
    return report;
  }

  const ambiensId = ctx.companyIdByTradeName.get('AMBIENS');
  if (!ambiensId) {
    report.error('Empresa "Ambiens" não encontrada no banco — rode o seed antes de importar.');
    return report;
  }

  const rows = readSheetRows(workbook, 'Cadastro de pessoal', 'Nome');
  for (const row of rows) {
    const name = toTrimmedString(row['Nome']);
    if (!name) continue;
    report.processed++;

    const existing = await ctx.prisma.employee.findFirst({ where: { companyId: ambiensId, name } });
    if (existing) {
      report.skipped++;
      continue;
    }

    const commissionValue = toNumber(row['Comissão']);
    const data = {
      companyId: ambiensId,
      name,
      email: toTrimmedString(row['Email']),
      phone: toTrimmedString(row['Contato']),
      document: toTrimmedString(row['cpf/cnpj']),
      pixKey: toTrimmedString(row['Pix']),
      role: toTrimmedString(row['Função']) ?? 'Não informado',
      baseSalary: toNumber(row['Remuneração']),
      commissionType: CommissionType.FIXED,
      commissionValue,
    };

    if (ctx.dryRun) {
      report.created++;
      continue;
    }
    await ctx.prisma.employee.create({ data });
    report.created++;
  }

  return report;
}
