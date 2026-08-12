import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
// ts-jest não dá o mesmo autoload de .env que `ts-node`/Node puro — carrega
// explicitamente para o PrismaClient enxergar DATABASE_URL nos testes.
import { config as loadEnv } from 'dotenv';
loadEnv({ path: path.resolve(__dirname, '../../.env'), quiet: true });

import { ChartAccountGroup } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PrismaService real, conectado ao Postgres local de desenvolvimento — os
 * testes deste arquivo em diante são de integração (não mocks), porque as
 * regras de cálculo que importam (DRE, fluxo de caixa, comissão, Simples
 * Nacional etc.) vivem em cima de agregações reais do Prisma. Cada suíte usa
 * sua própria Company isolada (id aleatório) e limpa tudo que criou ao final,
 * então é seguro rodar em paralelo com outras suítes contra o mesmo banco.
 */
export const prisma: PrismaService = new PrismaService();

export async function createTestUser(label: string): Promise<string> {
  const user = await prisma.user.create({
    data: {
      name: `Usuário de teste (${label})`,
      email: `teste-${label}-${randomUUID()}@example.com`,
      passwordHash: 'not-a-real-hash',
    },
  });
  return user.id;
}

export async function createTestCompany(label: string): Promise<string> {
  const company = await prisma.company.create({
    data: {
      name: `Empresa de teste (${label})`,
      tradeName: label,
      cnpj: randomUUID().replace(/-/g, '').slice(0, 14),
    },
  });
  return company.id;
}

export async function createCostCenter(companyId: string, name = 'Geral'): Promise<string> {
  const costCenter = await prisma.costCenter.create({ data: { companyId, name } });
  return costCenter.id;
}

export async function createChartOfAccount(group: ChartAccountGroup, name: string): Promise<string> {
  const account = await prisma.chartOfAccount.create({ data: { group, name } });
  return account.id;
}

export async function createBankAccount(companyId: string, name: string, initialBalance = 0): Promise<string> {
  const account = await prisma.bankAccount.create({ data: { companyId, name, initialBalance } });
  return account.id;
}

/** Remove todos os dados criados sob uma Company de teste, na ordem que respeita as FKs. */
export async function cleanupCompany(companyId: string, chartOfAccountIds: string[] = []): Promise<void> {
  await prisma.accountTransfer.deleteMany({
    where: { OR: [{ sourceAccount: { companyId } }, { destinationAccount: { companyId } }] },
  });
  await prisma.financialEntry.deleteMany({ where: { companyId } });
  await prisma.job.deleteMany({ where: { companyId } });
  await prisma.taxCalculationSnapshot.deleteMany({ where: { companyId } });
  await prisma.revenueGoal.deleteMany({ where: { companyId } });
  await prisma.revenueProjection.deleteMany({ where: { companyId } });
  await prisma.bankAccount.deleteMany({ where: { companyId } });
  await prisma.client.deleteMany({ where: { companyId } });
  await prisma.supplier.deleteMany({ where: { companyId } });
  await prisma.employee.deleteMany({ where: { companyId } });
  await prisma.costCenter.deleteMany({ where: { companyId } });
  await prisma.company.delete({ where: { id: companyId } });
  if (chartOfAccountIds.length > 0) {
    await prisma.chartOfAccount.deleteMany({ where: { id: { in: chartOfAccountIds } } });
  }
}

export async function cleanupUser(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}

export function utcDate(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day));
}
