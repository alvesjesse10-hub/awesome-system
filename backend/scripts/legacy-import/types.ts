import { PrismaClient } from '@prisma/client';

export class ImportReport {
  readonly sheet: string;
  processed = 0;
  created = 0;
  updated = 0;
  skipped = 0;
  readonly warnings: string[] = [];
  readonly errors: string[] = [];

  constructor(sheet: string) {
    this.sheet = sheet;
  }

  warn(message: string) {
    this.warnings.push(message);
  }

  error(message: string) {
    this.errors.push(message);
  }

  summary(): string {
    return `${this.sheet}: ${this.processed} lidas, ${this.created} criadas, ${this.updated} atualizadas, ${this.skipped} puladas, ${this.warnings.length} avisos, ${this.errors.length} erros`;
  }
}

export interface ImportContext {
  prisma: PrismaClient;
  dryRun: boolean;
  importedByUserId: string;
  /** tradeName (maiúsculo/sem acento) -> companyId */
  companyIdByTradeName: Map<string, string>;
  /** companyId -> id do CostCenter "Geral" daquela empresa */
  generalCostCenterByCompany: Map<string, string>;
  /** "GRUPO|NOME_NORMALIZADO" -> chartOfAccountId */
  chartOfAccountByGroupAndName: Map<string, string>;
  /** "companyId|NOME_NORMALIZADO" -> bankAccountId */
  bankAccountByCompanyAndName: Map<string, string>;
  /** "companyId|NOME_NORMALIZADO" -> clientId, populado conforme os clientes são criados durante a importação */
  clientByCompanyAndName: Map<string, string>;
  /** NOME_NORMALIZADO -> dados de contato (Cadastro de clientes), usado para enriquecer clientes auto-criados a partir dos Lançamentos */
  clientEnrichmentByName: Map<string, { email: string | null; phone: string | null; address: string | null; document: string | null }>;
}
