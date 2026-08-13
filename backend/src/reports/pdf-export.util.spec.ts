import { PassThrough } from 'node:stream';
import { sendPdfTable } from './pdf-export.util';

/**
 * `sendPdfTable` escreve num `Response` real (headers + stream). Um
 * PassThrough com `setHeader` adicionado se comporta o suficiente como um
 * Express Response para o teste — inclusive emitindo 'finish' ao terminar,
 * que é justamente o evento que o bug original (ERR_STREAM_WRITE_AFTER_END)
 * mostrou que precisa ser aguardado corretamente.
 */
function createFakeResponse() {
  const stream = new PassThrough();
  const headers: Record<string, string> = {};
  return Object.assign(stream, {
    setHeader: (key: string, value: string) => {
      headers[key] = value;
    },
    headers,
  });
}

describe('sendPdfTable', () => {
  it('resolve a Promise só depois que o PDF termina de ser escrito no response (stream "finish")', async () => {
    const res = createFakeResponse();
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));

    await sendPdfTable(
      res as any,
      'teste.pdf',
      'Relatório de Teste',
      [
        { key: 'a', label: 'Coluna A' },
        { key: 'b', label: 'Coluna B' },
      ],
      [{ a: 'valor', b: 42 }],
    );

    const buffer = Buffer.concat(chunks);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(res.headers['Content-Disposition']).toContain('teste.pdf');
  });

  it('não trava e produz um PDF válido quando não há linhas', async () => {
    const res = createFakeResponse();
    res.resume();

    await expect(
      sendPdfTable(res as any, 'vazio.pdf', 'Vazio', [{ key: 'a', label: 'A' }], []),
    ).resolves.toBeUndefined();
  });

  it('usa paisagem quando há muitas colunas (ex.: DRE com 12 meses + total)', async () => {
    const res = createFakeResponse();
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));

    const manyColumns = Array.from({ length: 14 }, (_, i) => ({ key: `c${i}`, label: `Col ${i}` }));
    await sendPdfTable(res as any, 'dre.pdf', 'DRE', manyColumns, []);

    const buffer = Buffer.concat(chunks);
    // MediaBox em paisagem tem a largura (primeiro valor após a origem) maior que a altura.
    const mediaBoxMatch = buffer.toString('latin1').match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
    expect(mediaBoxMatch).not.toBeNull();
    const [, width, height] = mediaBoxMatch!.map(Number) as unknown as [number, number, number];
    expect(width).toBeGreaterThan(height);
  });
});
