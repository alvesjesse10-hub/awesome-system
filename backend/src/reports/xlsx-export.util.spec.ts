import * as XLSX from 'xlsx';
import { sendXlsx } from './xlsx-export.util';

function createFakeResponse() {
  const headers: Record<string, string> = {};
  let sentBuffer: Buffer | undefined;
  return {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    send: (buffer: Buffer) => {
      sentBuffer = buffer;
    },
    headers,
    get sentBuffer() {
      return sentBuffer;
    },
  };
}

describe('sendXlsx', () => {
  it('grava uma planilha .xlsx real com valores numéricos nativos (não texto formatado)', () => {
    const res = createFakeResponse();

    sendXlsx(
      res as any,
      'teste.xlsx',
      [
        { key: 'name', label: 'Nome' },
        { key: 'amount', label: 'Valor' },
      ],
      [
        { name: 'Item A', amount: 1234.5 },
        { name: 'Item B', amount: 0 },
      ],
    );

    expect(res.headers['Content-Type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['Content-Disposition']).toContain('teste.xlsx');

    const workbook = XLSX.read(res.sentBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    expect(rows).toEqual([
      { Nome: 'Item A', Valor: 1234.5 },
      { Nome: 'Item B', Valor: 0 },
    ]);
    // Confere que o valor foi escrito como número real na planilha, não string.
    expect(sheet['B2'].t).toBe('n');
  });

  it('mantém a ordem das colunas definida, mesmo que as linhas tenham as chaves fora de ordem', () => {
    const res = createFakeResponse();

    sendXlsx(
      res as any,
      'ordem.xlsx',
      [
        { key: 'b', label: 'Segunda' },
        { key: 'a', label: 'Primeira' },
      ],
      [{ a: 1, b: 2 }],
    );

    const workbook = XLSX.read(res.sentBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(sheet['A1'].v).toBe('Segunda');
    expect(sheet['B1'].v).toBe('Primeira');
  });
});
