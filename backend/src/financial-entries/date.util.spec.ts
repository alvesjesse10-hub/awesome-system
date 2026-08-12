import { addMonthsUTC, getCompetence, splitAmountIntoInstallments } from './date.util';

describe('splitAmountIntoInstallments', () => {
  it('divide igualmente quando o valor é múltiplo do número de parcelas', () => {
    expect(splitAmountIntoInstallments(900, 3)).toEqual([300, 300, 300]);
  });

  it('joga o resto de arredondamento na última parcela, sem perder centavos', () => {
    const installments = splitAmountIntoInstallments(1000, 3);
    expect(installments).toEqual([333.33, 333.33, 333.34]);
    const sum = installments.reduce((acc, value) => acc + value, 0);
    expect(Math.round(sum * 100) / 100).toBe(1000);
  });

  it('funciona com uma única parcela', () => {
    expect(splitAmountIntoInstallments(1500.5, 1)).toEqual([1500.5]);
  });
});

describe('addMonthsUTC', () => {
  it('soma meses mantendo o dia quando existe no mês de destino', () => {
    const result = addMonthsUTC(new Date('2026-01-15T00:00:00Z'), 2);
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-15');
  });

  it('rola para o último dia do mês quando o dia de origem não existe no destino (31 -> fevereiro)', () => {
    const result = addMonthsUTC(new Date('2026-01-31T00:00:00Z'), 1);
    expect(result.toISOString().slice(0, 10)).toBe('2026-02-28');
  });
});

describe('getCompetence', () => {
  it('extrai mês (1-12) e ano em UTC', () => {
    expect(getCompetence(new Date('2026-12-05T00:00:00Z'))).toEqual({ month: 12, year: 2026 });
  });
});
