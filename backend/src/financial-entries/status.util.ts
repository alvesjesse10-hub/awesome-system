import { EntryStatus } from '@prisma/client';

export type DisplayStatus = 'PAGO' | 'A_PAGAR' | 'ATRASADO';

/**
 * "Atrasado" nunca é persistido — é sempre PENDING + vencimento no passado
 * calculado no momento da leitura, para nunca ficar desatualizado.
 */
export function computeDisplayStatus(status: EntryStatus, dueDate: Date): DisplayStatus {
  if (status === EntryStatus.PAID) {
    return 'PAGO';
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return dueDate.getTime() < today.getTime() ? 'ATRASADO' : 'A_PAGAR';
}

export function withDisplayStatus<T extends { status: EntryStatus; dueDate: Date }>(
  entry: T,
): T & { displayStatus: DisplayStatus } {
  return { ...entry, displayStatus: computeDisplayStatus(entry.status, entry.dueDate) };
}
