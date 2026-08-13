import { ChartAccountGroup, EntryNature } from '@prisma/client';
import { RevenueGoalsService } from './revenue-goals.service';
import { ReportsService } from '../reports/reports.service';
import {
  cleanupCompany,
  cleanupUser,
  createChartOfAccount,
  createCostCenter,
  createTestCompany,
  createTestUser,
  prisma,
  utcDate,
} from '../test-utils/fixtures';

describe('RevenueGoalsService (integração)', () => {
  const service = new RevenueGoalsService(prisma, new ReportsService(prisma));

  let companyId: string;
  let userId: string;
  let costCenterId: string;
  let receitaId: string;

  beforeAll(async () => {
    companyId = await createTestCompany('goals');
    userId = await createTestUser('goals');
    costCenterId = await createCostCenter(companyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços (goals spec)');
  });

  afterAll(async () => {
    await cleanupCompany(companyId, [receitaId]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  it('compara meta x realizado por mês (regime de competência, mesma base do DRE) e calcula % de atingimento', async () => {
    const year = 2044;
    await service.create(companyId, { year, month: 3, targetAmount: 10000 } as any);
    await prisma.financialEntry.create({
      data: {
        companyId,
        costCenterId,
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        description: 'Receita meta março',
        amount: 8000,
        entryDate: utcDate(year, 3, 10),
        dueDate: utcDate(year, 3, 10),
        competenceMonth: 3,
        competenceYear: year,
        dueMonth: 3,
        dueYear: year,
        createdByUserId: userId,
      },
    });

    const comparison = await service.comparison(companyId, year);
    const march = comparison.find((c) => c.month === 3)!;
    expect(march.target).toBe(10000);
    expect(march.realized).toBe(8000);
    expect(march.achievementPercent).toBeCloseTo(80);

    const april = comparison.find((c) => c.month === 4)!;
    expect(april.target).toBe(0);
    expect(april.achievementPercent).toBeNull(); // sem meta cadastrada, não divide por zero
  });
});
