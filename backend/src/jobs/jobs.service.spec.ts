import { BadRequestException } from '@nestjs/common';
import { ChartAccountGroup, CommissionType, SaleType } from '@prisma/client';
import { JobsService } from './jobs.service';
import { FinancialEntriesService } from '../financial-entries/financial-entries.service';
import {
  cleanupCompany,
  cleanupUser,
  createChartOfAccount,
  createCostCenter,
  createTestCompany,
  createTestUser,
  prisma,
} from '../test-utils/fixtures';

describe('JobsService (integração)', () => {
  const financialEntries = new FinancialEntriesService(prisma);
  const service = new JobsService(prisma, financialEntries);

  let companyId: string;
  let userId: string;
  let costCenterId: string;
  let receitaId: string;
  let clientId: string;

  beforeAll(async () => {
    companyId = await createTestCompany('jobs');
    userId = await createTestUser('jobs');
    costCenterId = await createCostCenter(companyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços (jobs spec)');
    const client = await prisma.client.create({ data: { companyId, name: 'Cliente do job' } });
    clientId = client.id;
  });

  afterAll(async () => {
    await cleanupCompany(companyId, [receitaId]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  async function createEmployee(commissionType: CommissionType, commissionValue: number) {
    return prisma.employee.create({
      data: { companyId, name: `Comercial ${Date.now()}-${Math.random()}`, role: 'Comercial', commissionType, commissionValue },
    });
  }

  describe('create — cálculo de comissão', () => {
    it('comissão PERCENTAGE incide sobre riskValue + successValue quando saleType é RISCO_SUCCESS', async () => {
      const employee = await createEmployee(CommissionType.PERCENTAGE, 10);
      const job = await service.create(companyId, userId, {
        name: `Job risco+success ${Date.now()}`,
        saleType: SaleType.RISCO_SUCCESS,
        riskValue: 1000,
        successValue: 2000,
        responsibleEmployeeId: employee.id,
      } as any);

      expect(Number(job.calculatedCommission)).toBe((1000 + 2000) * 0.1);
    });

    it('comissão PERCENTAGE incide sobre closedValue quando saleType é VALOR_UNICO', async () => {
      const employee = await createEmployee(CommissionType.PERCENTAGE, 5);
      const job = await service.create(companyId, userId, {
        name: `Job valor único ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 8000,
        responsibleEmployeeId: employee.id,
      } as any);

      expect(Number(job.calculatedCommission)).toBe(8000 * 0.05);
    });

    it('comissão FIXED ignora o valor do job e usa o valor fixo do colaborador', async () => {
      const employee = await createEmployee(CommissionType.FIXED, 1500);
      const job = await service.create(companyId, userId, {
        name: `Job comissão fixa ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 999999,
        responsibleEmployeeId: employee.id,
      } as any);

      expect(Number(job.calculatedCommission)).toBe(1500);
    });

    it('sem colaborador responsável, calculatedCommission fica nulo', async () => {
      const job = await service.create(companyId, userId, {
        name: `Job sem responsável ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 5000,
      } as any);

      expect(job.calculatedCommission).toBeNull();
    });
  });

  describe('update — recálculo de comissão', () => {
    it('recalcula a comissão quando o valor do job muda, combinando com os campos já existentes', async () => {
      const employee = await createEmployee(CommissionType.PERCENTAGE, 10);
      const job = await service.create(companyId, userId, {
        name: `Job a atualizar ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 1000,
        responsibleEmployeeId: employee.id,
      } as any);
      expect(Number(job.calculatedCommission)).toBe(100);

      const updated = await service.update(companyId, job.id, { closedValue: 4000 } as any);
      expect(Number(updated.calculatedCommission)).toBe(400);
    });

    it('não mexe na comissão quando nenhum campo de valor/responsável muda', async () => {
      const employee = await createEmployee(CommissionType.PERCENTAGE, 10);
      const job = await service.create(companyId, userId, {
        name: `Job estável ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 1000,
        responsibleEmployeeId: employee.id,
      } as any);

      const updated = await service.update(companyId, job.id, { location: 'Novo local' } as any);
      expect(Number(updated.calculatedCommission)).toBe(Number(job.calculatedCommission));
    });
  });

  describe('generateEntry', () => {
    it('gera lançamento de receita com valor = riskValue + successValue (RISCO_SUCCESS)', async () => {
      const job = await service.create(companyId, userId, {
        name: `Job gerar lançamento ${Date.now()}`,
        saleType: SaleType.RISCO_SUCCESS,
        riskValue: 3000,
        successValue: 1000,
        clientId,
      } as any);

      const entries = await service.generateEntry(companyId, userId, job.id, {
        costCenterId,
        chartOfAccountId: receitaId,
        entryDate: '2036-01-01',
        dueDate: '2036-01-10',
      });

      expect(entries).toHaveLength(1);
      expect(Number(entries[0].amount)).toBe(4000);
      expect(entries[0].jobId).toBe(job.id);
      expect(entries[0].clientId).toBe(clientId);
    });

    it('rejeita quando o job não tem cliente vinculado', async () => {
      const job = await service.create(companyId, userId, {
        name: `Job sem cliente ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 1000,
      } as any);

      await expect(
        service.generateEntry(companyId, userId, job.id, {
          costCenterId,
          chartOfAccountId: receitaId,
          entryDate: '2036-01-01',
          dueDate: '2036-01-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando o job não tem valor definido', async () => {
      const job = await service.create(companyId, userId, {
        name: `Job sem valor ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        clientId,
      } as any);

      await expect(
        service.generateEntry(companyId, userId, job.id, {
          costCenterId,
          chartOfAccountId: receitaId,
          entryDate: '2036-01-01',
          dueDate: '2036-01-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando a categoria escolhida não é do grupo Receita', async () => {
      const despesaId = await createChartOfAccount(ChartAccountGroup.CUSTO_FIXO, 'Custo (jobs spec generateEntry)');
      const job = await service.create(companyId, userId, {
        name: `Job categoria errada ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 1000,
        clientId,
      } as any);

      await expect(
        service.generateEntry(companyId, userId, job.id, {
          costCenterId,
          chartOfAccountId: despesaId,
          entryDate: '2036-01-01',
          dueDate: '2036-01-10',
        }),
      ).rejects.toThrow(BadRequestException);

      await prisma.chartOfAccount.delete({ where: { id: despesaId } });
    });
  });

  describe('pipeline', () => {
    it('agrupa jobs por etapa do funil e soma o valor total (via getJobTotalValue) por etapa', async () => {
      const jobA = await service.create(companyId, userId, {
        name: `Pipeline A ${Date.now()}`,
        saleType: SaleType.VALOR_UNICO,
        closedValue: 1000,
        funnelStage: 'FOLLOW',
      } as any);
      const jobB = await service.create(companyId, userId, {
        name: `Pipeline B ${Date.now()}`,
        saleType: SaleType.RISCO_SUCCESS,
        riskValue: 500,
        successValue: 500,
        funnelStage: 'FOLLOW',
      } as any);

      const pipeline = await service.pipeline(companyId);
      const followBucket = pipeline.find((b) => b.stage === 'FOLLOW')!;
      const jobIds = followBucket.jobs.map((j) => j.id);
      expect(jobIds).toEqual(expect.arrayContaining([jobA.id, jobB.id]));
      expect(followBucket.totalValue).toBeGreaterThanOrEqual(2000);
    });
  });
});
