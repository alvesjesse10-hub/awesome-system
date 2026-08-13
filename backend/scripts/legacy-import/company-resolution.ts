import { normalizeKey } from './xlsx-utils';
import type { ImportContext } from './types';

/**
 * Na aba Lançamentos e na aba Saldo bancos, a coluna "Centro de custo"
 * também é usada para nomear contas de aplicação/investimento (ex.:
 * "Aplicação Ambiens"), que precisam ser atribuídas a UMA empresa mesmo
 * sem ligação explícita no arquivo. "Aplicação Geral" e "Renda Fixa" não
 * têm dono claro — caem em Ambiens (empresa "titular" do arquivo) e ficam
 * marcadas como aproximação no relatório de importação.
 */
const CENTRO_DE_CUSTO_COMPANY: Record<string, { tradeName: string; assumed?: boolean }> = {
  AMBIENS: { tradeName: 'Ambiens' },
  SMART: { tradeName: 'Smart' },
  IGH: { tradeName: 'IGH' },
  'APLICACAO AMBIENS': { tradeName: 'Ambiens' },
  'APLICACAO SMART': { tradeName: 'Smart' },
  'APLICACAO GERAL': { tradeName: 'Ambiens', assumed: true },
  'RENDA FIXA': { tradeName: 'Ambiens', assumed: true },
};

export interface CompanyResolution {
  companyId: string;
  assumed: boolean;
}

export function resolveCompanyByCentroDeCusto(ctx: ImportContext, centroDeCusto: string): CompanyResolution | null {
  const entry = CENTRO_DE_CUSTO_COMPANY[normalizeKey(centroDeCusto)];
  if (!entry) return null;
  const companyId = ctx.companyIdByTradeName.get(normalizeKey(entry.tradeName));
  if (!companyId) return null;
  return { companyId, assumed: entry.assumed ?? false };
}

export function isInvestmentCentroDeCusto(centroDeCusto: string): boolean {
  return normalizeKey(centroDeCusto).startsWith('APLICACAO') || normalizeKey(centroDeCusto) === 'RENDA FIXA';
}
