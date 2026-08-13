import { EntryStatus } from '@prisma/client';
import { computeDisplayStatus } from './status.util';

describe('computeDisplayStatus', () => {
  it('retorna PAGO quando o status persistido é PAID, independente do vencimento', () => {
    expect(computeDisplayStatus(EntryStatus.PAID, new Date('2020-01-01'))).toBe('PAGO');
  });

  it('retorna A_PAGAR quando PENDING e vencimento é hoje ou no futuro', () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    expect(computeDisplayStatus(EntryStatus.PENDING, tomorrow)).toBe('A_PAGAR');
  });

  it('retorna ATRASADO quando PENDING e vencimento no passado', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    expect(computeDisplayStatus(EntryStatus.PENDING, yesterday)).toBe('ATRASADO');
  });
});
