import { PrismaClient } from '@prisma/client';
import { normalizeKey } from './xlsx-utils';
import type { ImportContext } from './types';

export async function buildImportContext(prisma: PrismaClient, importedByEmail: string, dryRun: boolean): Promise<ImportContext> {
  const user = await prisma.user.findUnique({ where: { email: importedByEmail } });
  if (!user) {
    throw new Error(
      `Usuário "${importedByEmail}" não encontrado — informe um usuário existente com --imported-by-email para atribuir a autoria dos registros importados.`,
    );
  }

  const companies = await prisma.company.findMany();
  const companyIdByTradeName = new Map<string, string>();
  for (const company of companies) {
    companyIdByTradeName.set(normalizeKey(company.tradeName ?? company.name), company.id);
  }

  const generalCostCenterByCompany = new Map<string, string>();
  for (const company of companies) {
    const costCenter = await prisma.costCenter.findFirst({ where: { companyId: company.id, name: 'Geral' } });
    if (costCenter) {
      generalCostCenterByCompany.set(company.id, costCenter.id);
    }
  }

  const chartOfAccounts = await prisma.chartOfAccount.findMany({ where: { parentId: { not: null } } });
  const chartOfAccountByGroupAndName = new Map<string, string>();
  for (const account of chartOfAccounts) {
    chartOfAccountByGroupAndName.set(`${account.group}|${normalizeKey(account.name)}`, account.id);
  }

  const bankAccounts = await prisma.bankAccount.findMany();
  const bankAccountByCompanyAndName = new Map<string, string>();
  for (const account of bankAccounts) {
    bankAccountByCompanyAndName.set(`${account.companyId}|${normalizeKey(account.name)}`, account.id);
  }

  const clients = await prisma.client.findMany();
  const clientByCompanyAndName = new Map<string, string>();
  for (const client of clients) {
    clientByCompanyAndName.set(`${client.companyId}|${normalizeKey(client.name)}`, client.id);
  }

  return {
    prisma,
    dryRun,
    importedByUserId: user.id,
    companyIdByTradeName,
    generalCostCenterByCompany,
    chartOfAccountByGroupAndName,
    bankAccountByCompanyAndName,
    clientByCompanyAndName,
    clientEnrichmentByName: new Map(),
  };
}
