export interface SimplesBracket {
  bracketOrder: number;
  revenueFrom: number;
  revenueTo: number;
  nominalRate: number;
  deduction: number;
}

/** Retorna null se a RBT12 estiver fora de todas as faixas cadastradas (ex.: empresa excedeu o limite do Simples Nacional). */
export function findBracket(brackets: SimplesBracket[], rbt12: number): SimplesBracket | null {
  return brackets.find((bracket) => rbt12 >= bracket.revenueFrom && rbt12 <= bracket.revenueTo) ?? null;
}

/** Fórmula padrão do Simples Nacional: aliq. efetiva = ((RBT12 × aliq. nominal) − dedução) / RBT12. */
export function calculateEffectiveRate(rbt12: number, nominalRate: number, deduction: number): number {
  if (rbt12 <= 0) return 0;
  return (rbt12 * nominalRate - deduction) / rbt12;
}

/** DAS incide sobre o faturamento do MÊS corrente (não sobre a RBT12), à alíquota efetiva apurada. */
export function calculateDas(monthRevenue: number, effectiveRate: number): number {
  return Math.round(monthRevenue * effectiveRate * 100) / 100;
}
