import { escapeCsvCell } from './csv.util';

describe('escapeCsvCell', () => {
  it('retorna string vazia para null/undefined', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('converte números para string', () => {
    expect(escapeCsvCell(1234.5)).toBe('1234.5');
  });

  it('envolve em aspas e escapa aspas internas quando o valor contém ; " ou quebra de linha', () => {
    expect(escapeCsvCell('Cliente; Ltda')).toBe('"Cliente; Ltda"');
    expect(escapeCsvCell('Disse "oi"')).toBe('"Disse ""oi"""');
    expect(escapeCsvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('não altera texto simples', () => {
    expect(escapeCsvCell('Ambiens')).toBe('Ambiens');
  });
});
