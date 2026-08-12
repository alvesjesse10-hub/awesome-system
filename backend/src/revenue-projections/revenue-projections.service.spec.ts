import { ChartAccountGroup, EntryNature } from '@prisma/client';
import { RevenueProjectionsService } from './revenue-projections.service';
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

describe('RevenueProjectionsService (integração)', () => {
  const service = new RevenueProjectionsService(prisma, new ReportsService(prisma));

  let companyId: string;
  let userId: string;
  let costCenterId: string;
  let receitaId: string;
  let receitaId2: string;

  beforeAll(async () => {
    companyId = await createTestCompany('projections');
    userId = await createTestUser('projections');
    costCenterId = await createCostCenter(companyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços A (projections spec)');
    receitaId2 = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços B (projections spec)');
  });

  afterAll(async () => {
    await cleanupCompany(companyId, [receitaId, receitaId2]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  it('soma a projeção de todas as categorias do mês e compara com o realizado (DRE)', async () => {
    const year = 2045;
    await service.create(companyId, { chartOfAccountId: receitaId, year, month: 7, projectedAmount: 3000 } as any);
    await service.create(companyId, { chartOfAccountId: receitaId2, year, month: 7, projectedAmount: 2000 } as any);

    await prisma.financialEntry.create({
      data: {
        companyId,
        costCenterId,
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        description: 'Receita projeção julho',
        amount: 4500,
        entryDate: utcDate(year, 7, 5),
        dueDate: utcDate(year, 7, 5),
        competenceMonth: 7,
        competenceYear: year,
        dueMonth: 7,
        dueYear: year,
        createdByUserId: userId,
      },
    });

    const comparison = await service.comparison(companyId, year);
    const july = comparison.find((c) => c.month === 7)!;
    expect(july.projected).toBe(5000); // soma das duas categorias
    expect(july.realized).toBe(4500);
  });
});
