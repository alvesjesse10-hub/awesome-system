import { BadRequestException } from '@nestjs/common';
import { ChartAccountGroup, EntryNature, SimplesAnnex } from '@prisma/client';
import { SimplesNacionalService } from './simples-nacional.service';
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

// Usa ANEXO_V (não usado pelo seed) para não colidir com a tabela real do
// ANEXO_III cadastrada no banco de desenvolvimento.
const TEST_ANNEX = SimplesAnnex.ANEXO_V;

describe('SimplesNacionalService (integração)', () => {
  const service = new SimplesNacionalService(prisma);

  let companyId: string;
  let userId: string;
  let costCenterId: string;
  let receitaId: string;
  const bracketIds: string[] = [];

  beforeAll(async () => {
    companyId = await createTestCompany('simples');
    userId = await createTestUser('simples');
    costCenterId = await createCostCenter(companyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços (simples spec)');
  });

  afterAll(async () => {
    await prisma.simplesNacionalBracket.deleteMany({ where: { id: { in: bracketIds } } });
    await cleanupCompany(companyId, [receitaId]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  async function createBracket(opts: {
    annex?: SimplesAnnex;
    bracketOrder: number;
    revenueFrom: number;
    revenueTo: number;
    nominalRate: number;
    deduction: number;
    effectiveFrom: Date;
  }) {
    const { annex = TEST_ANNEX, ...rest } = opts;
    const bracket = await prisma.simplesNacionalBracket.create({
      data: { annex, ...rest },
    });
    bracketIds.push(bracket.id);
    return bracket;
  }

  async function createRevenueEntry(amount: number, entryDate: Date) {
    return prisma.financialEntry.create({
      data: {
        companyId,
        costCenterId,
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        description: 'Receita para RBT12',
        amount,
        entryDate,
        dueDate: entryDate,
        competenceMonth: entryDate.getUTCMonth() + 1,
        competenceYear: entryDate.getUTCFullYear(),
        dueMonth: entryDate.getUTCMonth() + 1,
        dueYear: entryDate.getUTCFullYear(),
        createdByUserId: userId,
      },
    });
  }

  it('RBT12 soma receita dos 12 meses anteriores ao mês de referência (por entryDate), excluindo o 13º mês para trás', async () => {
    await createBracket({
      bracketOrder: 1,
      revenueFrom: 0,
      revenueTo: 10_000_000,
      nominalRate: 0.1,
      deduction: 0,
      effectiveFrom: utcDate(2020, 1, 1),
    });

    // referência: dezembro/2040. Janela RBT12 = jan/2040 .. dez/2040 (12 meses terminando no mês de referência).
    for (let month = 1; month <= 12; month++) {
      await createRevenueEntry(1000, utcDate(2040, month, 15));
    }
    // Fora da janela (dezembro/2039) — não deve entrar na RBT12.
    await createRevenueEntry(999_999, utcDate(2039, 12, 15));

    const result = await service.calculate(companyId, 2040, 12, TEST_ANNEX);
    expect(result.rbt12).toBe(12_000);
    expect(result.monthRevenue).toBe(1000); // só dezembro/2040
  });

  it('DAS incide sobre a receita do MÊS corrente à alíquota efetiva — não sobre a RBT12', async () => {
    // RBT12 = 12_000 (do teste anterior, mesma empresa) + este mês; isola com um mês de referência novo.
    await createRevenueEntry(5000, utcDate(2041, 1, 20));
    const result = await service.calculate(companyId, 2041, 1, TEST_ANNEX);

    const bracket = await prisma.simplesNacionalBracket.findFirst({ where: { annex: TEST_ANNEX, bracketOrder: 1 } });
    const expectedEffectiveRate = (result.rbt12 * Number(bracket!.nominalRate) - Number(bracket!.deduction)) / result.rbt12;
    expect(result.effectiveRate).toBeCloseTo(expectedEffectiveRate);
    expect(result.dasValue).toBeCloseTo(Math.round(result.monthRevenue * expectedEffectiveRate * 100) / 100);
    // Confirma que NÃO é RBT12 × alíquota (seria um valor bem maior)
    expect(result.dasValue).toBeLessThan(result.rbt12 * expectedEffectiveRate);
  });

  it('resolve a tabela vigente por effectiveFrom: usa a versão mais recente que ainda seja <= o mês de referência', async () => {
    const companyId2 = await createTestCompany('simples-versioning');
    const costCenterId2 = await createCostCenter(companyId2);

    await createBracket({
      annex: SimplesAnnex.ANEXO_II,
      bracketOrder: 1,
      revenueFrom: 0,
      revenueTo: 100_000,
      nominalRate: 0.04,
      deduction: 0,
      effectiveFrom: utcDate(2010, 1, 1),
    });
    await createBracket({
      annex: SimplesAnnex.ANEXO_II,
      bracketOrder: 1,
      revenueFrom: 0,
      revenueTo: 100_000,
      nominalRate: 0.08,
      deduction: 0,
      effectiveFrom: utcDate(2050, 1, 1), // tabela nova, só passa a valer a partir de 2050
    });

    await prisma.financialEntry.create({
      data: {
        companyId: companyId2,
        costCenterId: costCenterId2,
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        description: 'Receita versionamento',
        amount: 1000,
        entryDate: utcDate(2049, 6, 1),
        dueDate: utcDate(2049, 6, 1),
        competenceMonth: 6,
        competenceYear: 2049,
        dueMonth: 6,
        dueYear: 2049,
        createdByUserId: userId,
      },
    });

    // Referência em 2049 (antes da tabela nova de 2050) — deve usar a alíquota de 4%, não 8%.
    const resultOld = await service.calculate(companyId2, 2049, 6, SimplesAnnex.ANEXO_II);
    expect(resultOld.nominalRate).toBe(0.04);

    await cleanupCompany(companyId2);
  });

  it('rejeita quando não há tabela de faixas cadastrada para o Anexo', async () => {
    await expect(service.calculate(companyId, 2041, 1, SimplesAnnex.ANEXO_IV)).rejects.toThrow(BadRequestException);
  });

  it('rejeita quando a RBT12 excede o limite de todas as faixas cadastradas', async () => {
    const companyId3 = await createTestCompany('simples-excede');
    const costCenterId3 = await createCostCenter(companyId3);
    await createBracket({
      annex: SimplesAnnex.ANEXO_I,
      bracketOrder: 1,
      revenueFrom: 0,
      revenueTo: 1000,
      nominalRate: 0.05,
      deduction: 0,
      effectiveFrom: utcDate(2020, 1, 1),
    });
    await prisma.financialEntry.create({
      data: {
        companyId: companyId3,
        costCenterId: costCenterId3,
        chartOfAccountId: receitaId,
        nature: EntryNature.REVENUE,
        description: 'Receita acima do limite',
        amount: 999_999,
        entryDate: utcDate(2042, 3, 1),
        dueDate: utcDate(2042, 3, 1),
        competenceMonth: 3,
        competenceYear: 2042,
        dueMonth: 3,
        dueYear: 2042,
        createdByUserId: userId,
      },
    });

    await expect(service.calculate(companyId3, 2042, 3, SimplesAnnex.ANEXO_I)).rejects.toThrow(BadRequestException);
    await cleanupCompany(companyId3);
  });

  it('calculateAndSave grava (upsert) o snapshot do cálculo', async () => {
    await createRevenueEntry(2000, utcDate(2043, 5, 10));
    const result = await service.calculateAndSave(companyId, 2043, 5, TEST_ANNEX);

    const snapshot = await prisma.taxCalculationSnapshot.findUnique({
      where: { companyId_year_month: { companyId, year: 2043, month: 5 } },
    });
    expect(snapshot).not.toBeNull();
    expect(Number(snapshot!.dasValue)).toBeCloseTo(result.dasValue);

    // Rodar de novo (upsert) não deve criar um segundo snapshot.
    await service.calculateAndSave(companyId, 2043, 5, TEST_ANNEX);
    const count = await prisma.taxCalculationSnapshot.count({ where: { companyId, year: 2043, month: 5 } });
    expect(count).toBe(1);
  });
});
