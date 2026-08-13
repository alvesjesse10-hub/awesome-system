import { Response } from 'express';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
}

/** Exporta os mesmos dados usados no CSV como planilha .xlsx real (valores numéricos nativos, não texto). */
export function sendXlsx(res: Response, filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const data = rows.map((row) => Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? null])));
  const worksheet = XLSX.utils.json_to_sheet(data, { header: columns.map((column) => column.label) });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}
