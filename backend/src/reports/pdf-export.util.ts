import { Response } from 'express';
import PDFDocument from 'pdfkit';
import type { ExportColumn } from './xlsx-export.util';

const ROW_HEIGHT = 20;
const HEADER_FILL = '#f0f0f0';
const BORDER_COLOR = '#dddddd';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value);
}

/**
 * Tabela simples em PDF (título + grade de colunas/linhas), com paginação
 * automática. Usa paisagem quando há muitas colunas (ex.: DRE com um mês por
 * coluna) para caber mais texto por linha.
 *
 * `doc.pipe(res)` + `doc.end()` escrevem de forma ASSÍNCRONA — o handler do
 * controller precisa aguardar o fim de verdade (`res` 'finish') antes de
 * retornar, senão o Nest considera a resposta pronta cedo demais e o stream
 * do pdfkit acaba escrevendo depois do response já encerrado
 * (ERR_STREAM_WRITE_AFTER_END), o que derruba o processo inteiro por ser um
 * erro não tratado em um EventEmitter. Por isso retorna uma Promise.
 */
export function sendPdfTable(
  res: Response,
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): Promise<void> {
  const landscape = columns.length > 6;
  const doc = new PDFDocument({ margin: 36, size: 'A4', layout: landscape ? 'landscape' : 'portrait' });
  const fontSize = columns.length > 10 ? 7 : columns.length > 6 ? 8 : 9;

  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    doc.on('error', reject);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    renderTable(doc, title, columns, rows, fontSize);
    doc.end();
  });
}

/**
 * Larguras das colunas: a 1ª (normalmente um nome/categoria em texto) recebe
 * peso maior quando há muitas colunas — evita que rótulos como "Despesa
 * Variável" quebrem em duas linhas espremidos entre 12 colunas de mês.
 */
function computeColumnWidths(columns: ExportColumn[], tableWidth: number): number[] {
  const firstColumnWeight = columns.length > 4 ? 2.2 : 1;
  const totalWeight = firstColumnWeight + (columns.length - 1);
  const unit = tableWidth / totalWeight;
  return columns.map((_, i) => (i === 0 ? unit * firstColumnWeight : unit));
}

function renderTable(
  doc: PDFKit.PDFDocument,
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  fontSize: number,
) {
  const startX = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = computeColumnWidths(columns, tableWidth);
  const colX: number[] = [];
  colWidths.reduce((x, width) => {
    colX.push(x);
    return x + width;
  }, startX);
  // Célula de texto de UMA linha só: `height` + `ellipsis` truncam com "…"
  // em vez de deixar o texto quebrar e vazar para fora da linha da tabela.
  const cellTextOptions = (width: number) => ({ width: width - 8, height: ROW_HEIGHT - 8, ellipsis: true });

  function drawHeaderRow(y: number): number {
    doc.rect(startX, y, tableWidth, ROW_HEIGHT).fill(HEADER_FILL).stroke(BORDER_COLOR);
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(fontSize);
    columns.forEach((column, i) => {
      doc.text(column.label, colX[i] + 4, y + 6, cellTextOptions(colWidths[i]));
    });
    doc.font('Helvetica');
    return y + ROW_HEIGHT;
  }

  function drawTitle() {
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#000000').text(title, startX, doc.y);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#666666')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, startX, doc.y + 2);
    doc.moveDown(1);
    doc.fillColor('#000000');
  }

  drawTitle();
  let y = drawHeaderRow(doc.y);

  doc.fontSize(fontSize);
  for (const row of rows) {
    if (y + ROW_HEIGHT > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = drawHeaderRow(doc.page.margins.top);
    }
    doc.rect(startX, y, tableWidth, ROW_HEIGHT).stroke(BORDER_COLOR);
    columns.forEach((column, i) => {
      doc.text(formatCell(row[column.key]), colX[i] + 4, y + 6, cellTextOptions(colWidths[i]));
    });
    y += ROW_HEIGHT;
  }

  if (rows.length === 0) {
    doc.fillColor('#666666').text('Nenhum dado para o período selecionado.', startX, y + 6);
  }
}
