import * as XLSX from 'xlsx';
import { FunnelStage, JobPaymentStatus, SaleType } from '@prisma/client';
import { normalizeKey, readSheetRows, toDate, toNumber, toTrimmedString } from './xlsx-utils';
import {
  mapConcorrencia,
  mapDeliverables,
  mapEventType,
  mapJobResult,
  mapJobType,
  mapProduct,
  mapProjectSize,
  mapProjectType,
  mapProposalStatus,
  mapSaleType,
  mapServices,
  mapSituacaoPropostaToAjuste,
  mapStatusToFunnelStage,
  mapEtapaToFunnelStage,
  mapTemperature,
} from './mappings';
import type { ImportContext } from './types';
import { ImportReport } from './types';

/**
 * A planilha real não tem uma única coluna de "etapa do funil" com os 8
 * valores do nosso enum — a informação está espalhada entre "Status",
 * "Etapas" e "Situação da proposta". Esta função aplica, nessa ordem de
 * prioridade, a leitura mais fiel que conseguimos reconstruir; ver
 * docs/IMPORTACAO_PLANILHA.md para os valores reais observados.
 */
function resolveFunnelStage(status: string | null, etapa: string | null, situacaoProposta: string | null, saleType: SaleType | null): FunnelStage {
  const fromStatus = status ? mapStatusToFunnelStage(status) : null;
  if (fromStatus) return fromStatus;

  const fromSituacao = situacaoProposta ? mapSituacaoPropostaToAjuste(situacaoProposta) : null;
  if (fromSituacao) return fromSituacao;

  if (etapa && normalizeKey(etapa) === 'AGUARDANDO PAGAMENTO') {
    return saleType === SaleType.RISCO_SUCCESS ? FunnelStage.AG_PAGAMENTO_RISCO : FunnelStage.AG_PAGAMENTO_UNICO;
  }

  const fromEtapa = etapa ? mapEtapaToFunnelStage(etapa) : null;
  if (fromEtapa) return fromEtapa;

  if (situacaoProposta && normalizeKey(situacaoProposta) === 'PROPOSTA APROVADA') {
    return FunnelStage.PROPOSTA_APROVADA;
  }

  return FunnelStage.FOLLOW;
}

export async function importJobs(ctx: ImportContext, workbook: XLSX.WorkBook): Promise<ImportReport> {
  const report = new ImportReport('Acompanhamento');
  if (!workbook.Sheets['Acompanhamento']) {
    report.error('Aba "Acompanhamento" não encontrada.');
    return report;
  }

  const ambiensId = ctx.companyIdByTradeName.get('AMBIENS');
  if (!ambiensId) {
    report.error('Empresa "Ambiens" não encontrada no banco — rode o seed antes de importar.');
    return report;
  }

  // A planilha não indica a empresa dona de cada job — todos entram sob
  // Ambiens (empresa titular do arquivo). Mova manualmente pela tela de
  // Jobs se algum pertencer a Smart/IGH.
  report.warn('Todos os jobs foram importados sob a empresa Ambiens (a planilha não distingue a empresa por job).');

  const rows = readSheetRows(workbook, 'Acompanhamento', 'Nome');
  for (const row of rows) {
    const name = toTrimmedString(row['Nome']);
    if (!name) continue;
    report.processed++;

    try {
      const existing = await ctx.prisma.job.findFirst({ where: { companyId: ambiensId, name } });
      if (existing) {
        report.skipped++;
        continue;
      }

      const saleType = mapSaleType(toTrimmedString(row['Tipo de venda']));
      const funnelStage = resolveFunnelStage(
        toTrimmedString(row['Status']),
        toTrimmedString(row['Etapas']),
        toTrimmedString(row['Situação da proposta']),
        saleType,
      );

      const data = {
        companyId: ambiensId,
        name,
        agency: toTrimmedString(row['Agência']),
        brand: toTrimmedString(row['Marca']),
        contactName: toTrimmedString(row['Contato']),
        entryDate: toDate(row['Data de entrada']),
        proposalEntryDate: toDate(row['Data da entrada da proposta']),
        eventDate: toDate(row['Data do evento']),
        estimatedBudget: toNumber(row['Budget']),
        type: mapJobType(toTrimmedString(row['Job'])),
        service: mapServices(toTrimmedString(row['Serviço'])),
        competitionStatus: mapConcorrencia(toTrimmedString(row['Concorrência'])) ?? undefined,
        temperature: mapTemperature(toTrimmedString(row['Grau'])) ?? undefined,
        projectType: mapProjectType(toTrimmedString(row['Tipo'])) ?? undefined,
        product: mapProduct(toTrimmedString(row['Produto'])),
        location: toTrimmedString(row['Local']),
        deliverables: mapDeliverables(toTrimmedString(row['Entregáveis'])),
        projectSize: mapProjectSize(toTrimmedString(row['Tamanho do projeto'])),
        eventType: mapEventType(toTrimmedString(row['Tipo do evento'])),
        segment: toTrimmedString(row['Segmento']),
        funnelStage,
        proposalStatus: mapProposalStatus(toTrimmedString(row['Situação da proposta'])) ?? undefined,
        saleType,
        result: mapJobResult(toTrimmedString(row['Resultado'])) ?? undefined,
        closedValue: toNumber(row['Valor fechado']),
        riskValue: toNumber(row['Risco']),
        successValue: toNumber(row['Success']),
        calculatedCommission: toNumber(row['Comissão']),
        paymentStatus: JobPaymentStatus.A_PAGAR,
        createdByUserId: ctx.importedByUserId,
      };

      if (toTrimmedString(row['Produto']) && !data.product) {
        report.warn(`Job "${name}": produto "${row['Produto']}" não reconhecido — deixei em branco.`);
      }
      if (toTrimmedString(row['Tamanho do projeto']) && !data.projectSize) {
        report.warn(`Job "${name}": tamanho "${row['Tamanho do projeto']}" não reconhecido — deixei em branco.`);
      }
      if (toTrimmedString(row['Tipo do evento']) && !data.eventType) {
        report.warn(`Job "${name}": tipo de evento "${row['Tipo do evento']}" não reconhecido — deixei em branco.`);
      }

      if (ctx.dryRun) {
        report.created++;
        continue;
      }
      await ctx.prisma.job.create({ data });
      report.created++;
    } catch (error) {
      report.error(`Job "${name}": ${(error as Error).message}`);
    }
  }

  return report;
}
