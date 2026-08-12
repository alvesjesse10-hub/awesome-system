import { calculateDas, calculateEffectiveRate, findBracket, type SimplesBracket } from './simples-nacional.util';

const ANEXO_III: SimplesBracket[] = [
  { bracketOrder: 1, revenueFrom: 0, revenueTo: 180_000, nominalRate: 0.06, deduction: 0 },
  { bracketOrder: 2, revenueFrom: 180_000.01, revenueTo: 360_000, nominalRate: 0.112, deduction: 9_360 },
  { bracketOrder: 3, revenueFrom: 360_000.01, revenueTo: 720_000, nominalRate: 0.135, deduction: 17_640 },
  { bracketOrder: 4, revenueFrom: 720_000.01, revenueTo: 1_800_000, nominalRate: 0.16, deduction: 35_640 },
  { bracketOrder: 5, revenueFrom: 1_800_000.01, revenueTo: 3_600_000, nominalRate: 0.21, deduction: 125_640 },
  { bracketOrder: 6, revenueFrom: 3_600_000.01, revenueTo: 4_800_000, nominalRate: 0.33, deduction: 648_000 },
];

describe('findBracket', () => {
  it('encontra a faixa correta pela RBT12', () => {
    expect(findBracket(ANEXO_III, 800_000)?.bracketOrder).toBe(4);
    expect(findBracket(ANEXO_III, 100_000)?.bracketOrder).toBe(1);
    expect(findBracket(ANEXO_III, 4_800_000)?.bracketOrder).toBe(6);
  });

  it('retorna null quando a RBT12 excede o limite do Simples Nacional', () => {
    expect(findBracket(ANEXO_III, 5_000_000)).toBeNull();
  });
});

describe('calculateEffectiveRate', () => {
  it('aplica a fórmula padrão do Simples Nacional', () => {
    // Faixa 4: RBT12=800000 -> ((800000*0.16)-35640)/800000 = 0.11545
    expect(calculateEffectiveRate(800_000, 0.16, 35_640)).toBeCloseTo(0.11545, 6);
  });

  it('retorna 0 quando RBT12 é zero (evita divisão por zero)', () => {
    expect(calculateEffectiveRate(0, 0.06, 0)).toBe(0);
  });
});

describe('calculateDas', () => {
  it('aplica a alíquota efetiva sobre o faturamento do MÊS, não da RBT12', () => {
    expect(calculateDas(70_000, 0.11545)).toBeCloseTo(8081.5, 2);
  });

  it('arredonda para 2 casas decimais', () => {
    expect(calculateDas(1000, 0.123456)).toBe(123.46);
  });
});
