import { Response } from 'express';

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** CSV simples (separador ;, compatível com Excel PT-BR) para exportação dos relatórios. */
export function sendCsv(
  res: Response,
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[],
) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(';');
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(';'));
  const csv = '﻿' + [header, ...lines].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}
