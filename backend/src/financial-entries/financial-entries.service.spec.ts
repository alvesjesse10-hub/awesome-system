import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChartAccountGroup } from '@prisma/client';
import { FinancialEntriesService } from './financial-entries.service';
import {
  cleanupCompany,
  cleanupUser,
  createChartOfAccount,
  createCostCenter,
  createTestCompany,
  createTestUser,
  prisma,
} from '../test-utils/fixtures';

describe('FinancialEntriesService (integração)', () => {
  const service = new FinancialEntriesService(prisma);

  let companyId: string;
  let otherCompanyId: string;
  let userId: string;
  let costCenterId: string;
  let otherCostCenterId: string;
  let receitaId: string;
  let custoFixoId: string;
  let clientId: string;

  beforeAll(async () => {
    companyId = await createTestCompany('entries');
    otherCompanyId = await createTestCompany('entries-other');
    userId = await createTestUser('entries');
    costCenterId = await createCostCenter(companyId);
    otherCostCenterId = await createCostCenter(otherCompanyId);
    receitaId = await createChartOfAccount(ChartAccountGroup.RECEITA, 'Serviços (entries spec)');
    custoFixoId = await createChartOfAccount(ChartAccountGroup.CUSTO_FIXO, 'Aluguel (entries spec)');
    const client = await prisma.client.create({ data: { companyId, name: 'Cliente parcelamento' } });
    clientId = client.id;
  });

  afterAll(async () => {
    await cleanupCompany(otherCompanyId);
    await cleanupCompany(companyId, [receitaId, custoFixoId]);
    await cleanupUser(userId);
    await prisma.$disconnect();
  });

  describe('create — parcelamento', () => {
    it('divide o valor em centavos sem deriva de arredondamento, última parcela absorve o resto', async () => {
      const created = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Job parcelado em 3x',
        amount: 100, // 100 / 3 = 33.33 recorrente
        installments: 3,
        entryDate: '2035-01-10',
        dueDate: '2035-02-05',
      });

      expect(created).toHaveLength(3);
      expect(Number(created[0].amount)).toBe(33.33);
      expect(Number(created[1].amount)).toBe(33.33);
      expect(Number(created[2].amount)).toBe(33.34); // absorve o centavo restante
      const total = created.reduce((sum, e) => sum + Number(e.amount), 0);
      expect(Math.round(total * 100)).toBe(10000);
    });

    it('gera vencimentos mensais sequenciais a partir da 1ª parcela e compartilha installmentGroupId', async () => {
      const created = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Job parcelado em 4x',
        amount: 4000,
        installments: 4,
        entryDate: '2035-01-10',
        dueDate: '2035-01-31', // dia 31 — testa a rolagem de mês (fev não tem 31)
      });

      expect(created.map((e) => e.installmentNumber)).toEqual([1, 2, 3, 4]);
      expect(created.every((e) => e.installmentTotal === 4)).toBe(true);
      const groupIds = new Set(created.map((e) => e.installmentGroupId));
      expect(groupIds.size).toBe(1);
      expect([...groupIds][0]).not.toBeNull();

      const dueDates = created.map((e) => new Date(e.dueDate).toISOString().slice(0, 10));
      expect(dueDates).toEqual(['2035-01-31', '2035-02-28', '2035-03-31', '2035-04-30']);
    });

    it('lançamento à vista (installments omitido) não recebe installmentGroupId', async () => {
      const [created] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Job à vista',
        amount: 500,
        entryDate: '2035-01-10',
        dueDate: '2035-01-20',
      });
      expect(created.installmentGroupId).toBeNull();
      expect(created.installmentTotal).toBe(1);
    });

    it('deriva a natureza (REVENUE/EXPENSE) do grupo da categoria do plano de contas, não de um campo enviado pelo cliente', async () => {
      const [revenue] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Receita',
        amount: 100,
        entryDate: '2035-01-10',
        dueDate: '2035-01-20',
      });
      expect(revenue.nature).toBe('REVENUE');

      const supplier = await prisma.supplier.create({ data: { companyId, name: 'Fornecedor de teste' } });
      const [expense] = await service.create(companyId, userId, {
        supplierId: supplier.id,
        costCenterId,
        chartOfAccountId: custoFixoId,
        description: 'Despesa',
        amount: 100,
        entryDate: '2035-01-10',
        dueDate: '2035-01-20',
      });
      expect(expense.nature).toBe('EXPENSE');
    });

    it('calcula competência (entryDate) e vencimento (dueDate) mês/ano independentemente', async () => {
      const [entry] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Competência x vencimento',
        amount: 100,
        entryDate: '2035-01-28',
        dueDate: '2035-02-03',
      });
      expect(entry.competenceMonth).toBe(1);
      expect(entry.competenceYear).toBe(2035);
      expect(entry.dueMonth).toBe(2);
      expect(entry.dueYear).toBe(2035);
    });
  });

  describe('create — validações', () => {
    const base = {
      costCenterId: '',
      chartOfAccountId: '',
      description: 'x',
      amount: 10,
      entryDate: '2035-01-01',
      dueDate: '2035-01-01',
    };

    it('rejeita quando nem cliente nem fornecedor são informados', async () => {
      await expect(
        service.create(companyId, userId, { ...base, costCenterId, chartOfAccountId: receitaId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita quando cliente E fornecedor são informados juntos', async () => {
      const supplier = await prisma.supplier.create({ data: { companyId, name: 'Fornecedor dúbio' } });
      await expect(
        service.create(companyId, userId, {
          ...base,
          clientId,
          supplierId: supplier.id,
          costCenterId,
          chartOfAccountId: receitaId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita centro de custo de outra empresa (isolamento multi-tenant)', async () => {
      await expect(
        service.create(companyId, userId, {
          ...base,
          clientId,
          costCenterId: otherCostCenterId,
          chartOfAccountId: receitaId,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('pay / unpay', () => {
    it('pay marca como PAID, grava data de pagamento e conta bancária; unpay reverte', async () => {
      const bankAccount = await prisma.bankAccount.create({ data: { companyId, name: 'Conta pagamento teste' } });
      const [created] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Lançamento para pagar',
        amount: 100,
        entryDate: '2035-01-01',
        dueDate: '2035-01-10',
      });

      const paid = await service.pay(companyId, userId, created.id, {
        paymentDate: '2035-01-08',
        bankAccountId: bankAccount.id,
      });
      expect(paid.status).toBe('PAID');
      expect(paid.bankAccountId).toBe(bankAccount.id);
      expect(new Date(paid.paymentDate!).toISOString().slice(0, 10)).toBe('2035-01-08');

      const unpaid = await service.unpay(companyId, userId, created.id);
      expect(unpaid.status).toBe('PENDING');
      expect(unpaid.paymentDate).toBeNull();
    });
  });

  describe('findAll — status computado', () => {
    it('OVERDUE só retorna PENDING com vencimento no passado; PAID nunca aparece em OVERDUE mesmo vencido', async () => {
      const overdueDue = new Date();
      overdueDue.setUTCDate(overdueDue.getUTCDate() - 5);
      const [overdue] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Vencido não pago',
        amount: 10,
        entryDate: overdueDue.toISOString().slice(0, 10),
        dueDate: overdueDue.toISOString().slice(0, 10),
      });

      const [paidButOverdue] = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Vencido mas pago',
        amount: 10,
        entryDate: overdueDue.toISOString().slice(0, 10),
        dueDate: overdueDue.toISOString().slice(0, 10),
      });
      const bankAccount = await prisma.bankAccount.create({ data: { companyId, name: 'Conta findAll teste' } });
      await service.pay(companyId, userId, paidButOverdue.id, {
        paymentDate: new Date().toISOString().slice(0, 10),
        bankAccountId: bankAccount.id,
      });

      const overdueList = await service.findAll(companyId, { status: 'OVERDUE' } as any);
      const ids = overdueList.items.map((i) => i.id);
      expect(ids).toContain(overdue.id);
      expect(ids).not.toContain(paidButOverdue.id);

      const overdueItem = overdueList.items.find((i) => i.id === overdue.id)!;
      expect((overdueItem as any).displayStatus).toBe('ATRASADO');
    });
  });

  describe('removeInstallmentGroup', () => {
    it('remove todas as parcelas do grupo de uma vez', async () => {
      const created = await service.create(companyId, userId, {
        clientId,
        costCenterId,
        chartOfAccountId: receitaId,
        description: 'Grupo a remover',
        amount: 300,
        installments: 3,
        entryDate: '2035-06-01',
        dueDate: '2035-06-10',
      });
      const groupId = created[0].installmentGroupId!;

      const result = await service.removeInstallmentGroup(companyId, groupId);
      expect(result.deleted).toBe(3);

      await expect(service.findOne(companyId, created[0].id)).rejects.toThrow(NotFoundException);
    });
  });
});
