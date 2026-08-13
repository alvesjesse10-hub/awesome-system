import { addDaysUTC, startOfDayUTC, sumArray } from './report-math.util';

describe('sumArray', () => {
  it('soma um array de números', () => {
    expect(sumArray([100, 200.5, -50])).toBe(250.5);
  });

  it('retorna 0 para array vazio', () => {
    expect(sumArray([])).toBe(0);
  });
});

describe('startOfDayUTC', () => {
  it('zera horas/minutos/segundos em UTC', () => {
    const result = startOfDayUTC(new Date('2026-08-12T23:45:10Z'));
    expect(result.toISOString()).toBe('2026-08-12T00:00:00.000Z');
  });
});

describe('addDaysUTC', () => {
  it('soma dias corretamente, inclusive virada de mês', () => {
    const result = addDaysUTC(new Date('2026-08-28T00:00:00Z'), 5);
    expect(result.toISOString().slice(0, 10)).toBe('2026-09-02');
  });
});
