export function getCompetence(date: Date): { month: number; year: number } {
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

export function addMonthsUTC(date: Date, months: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()),
  );
  // Se o dia não existir no mês de destino (ex.: 31 -> fevereiro), o JS já
  // rola para o mês seguinte; corrigimos voltando para o último dia do mês
  // de destino, para manter vencimentos mensais previsíveis.
  if (result.getUTCDate() !== date.getUTCDate()) {
    result.setUTCDate(0);
  }
  return result;
}

/** Divide um valor total em N parcelas (em centavos, sem deriva de arredondamento), última parcela absorve o resto. */
export function splitAmountIntoInstallments(totalAmount: number, installments: number): number[] {
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainderCents = totalCents - baseCents * installments;

  return Array.from({ length: installments }, (_, index) => {
    const cents = baseCents + (index === installments - 1 ? remainderCents : 0);
    return cents / 100;
  });
}
