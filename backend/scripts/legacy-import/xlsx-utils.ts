import * as XLSX from 'xlsx';

/**
 * As abas da planilha legada não têm o cabeçalho na linha 1 (há uma área de
 * formulário de cadastro rápido acima da tabela real). Esta função varre as
 * primeiras `maxScan` linhas e usa como cabeçalho a primeira que contiver
 * pelo menos `minNonEmpty` células não vazias — que é onde a tabela de
 * verdade começa em todas as abas que inspecionamos.
 */
export function findHeaderRow(sheet: XLSX.WorkSheet, maxScan = 30, minNonEmpty = 5): number {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, range: 0, blankrows: true });
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const row = rows[i] ?? [];
    const nonEmpty = row.filter((cell) => cell !== undefined && cell !== null && cell !== '').length;
    if (nonEmpty >= minNonEmpty) {
      return i;
    }
  }
  throw new Error(`Não encontrei uma linha de cabeçalho nas primeiras ${maxScan} linhas.`);
}

export interface SheetRow {
  [column: string]: unknown;
}

/**
 * Lê uma aba como lista de objetos {coluna: valor}, usando a linha de
 * cabeçalho detectada automaticamente (ou informada em `headerRowOverride`,
 * 0-indexed). Pula linhas totalmente vazias na coluna-âncora `requiredColumn`
 * (heurística simples de "fim da tabela").
 */
export function readSheetRows(
  workbook: XLSX.WorkBook,
  sheetName: string,
  requiredColumn: string,
  headerRowOverride?: number,
): SheetRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Aba "${sheetName}" não encontrada na planilha.`);
  }
  const headerRow = headerRowOverride ?? findHeaderRow(sheet);
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    range: headerRow,
    defval: null,
    raw: true,
  });
  return rows.filter((row) => row[requiredColumn] !== null && row[requiredColumn] !== undefined && row[requiredColumn] !== '');
}

export function toTrimmedString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/** As datas vêm como objetos Date (SheetJS com cellDates:true) ou seriais Excel. */
export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Remove acentos e normaliza maiúsculas/espaços, para comparar textos da planilha com tolerância a variação de digitação. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function loadWorkbook(filePath: string): XLSX.WorkBook {
  return XLSX.readFile(filePath, { cellDates: true, cellNF: false, cellText: false });
}
