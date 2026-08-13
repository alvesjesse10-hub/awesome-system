import { CommissionType, SaleType } from '@prisma/client';
import { calculateCommission, getJobTotalValue } from './commission.util';

describe('getJobTotalValue', () => {
  it('usa valor fechado para venda de Valor Único', () => {
    expect(
      getJobTotalValue({ saleType: SaleType.VALOR_UNICO, closedValue: 10000, riskValue: null, successValue: null }),
    ).toBe(10000);
  });

  it('soma risco + success para venda Risco + Success', () => {
    expect(
      getJobTotalValue({ saleType: SaleType.RISCO_SUCCESS, closedValue: null, riskValue: 3000, successValue: 7000 }),
    ).toBe(10000);
  });

  it('trata valores ausentes como zero', () => {
    expect(getJobTotalValue({ saleType: null, closedValue: null, riskValue: null, successValue: null })).toBe(0);
  });
});

describe('calculateCommission', () => {
  const job = { saleType: SaleType.VALOR_UNICO, closedValue: 10000, riskValue: null, successValue: null };

  it('retorna null sem colaborador responsável', () => {
    expect(calculateCommission(job, null)).toBeNull();
  });

  it('calcula comissão percentual sobre o valor total', () => {
    const employee = { commissionType: CommissionType.PERCENTAGE, commissionValue: 10 };
    expect(calculateCommission(job, employee)).toBe(1000);
  });

  it('retorna valor fixo quando comissão é FIXED, ignorando o valor do job', () => {
    const employee = { commissionType: CommissionType.FIXED, commissionValue: 500 };
    expect(calculateCommission(job, employee)).toBe(500);
  });

  it('arredonda comissão percentual para 2 casas decimais', () => {
    const employee = { commissionType: CommissionType.PERCENTAGE, commissionValue: 6 };
    const result = calculateCommission(
      { saleType: SaleType.RISCO_SUCCESS, closedValue: null, riskValue: 1000, successValue: 333.33 },
      employee,
    );
    // (1000 + 333.33) * 6% = 79.9998 -> arredonda para 80.00
    expect(result).toBe(80);
  });
});
