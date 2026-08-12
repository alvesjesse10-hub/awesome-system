import {
  ChartAccountGroup,
  CompetitionStatus,
  Deliverable,
  EventType,
  FunnelStage,
  JobResult,
  JobType,
  ProductType,
  ProjectSize,
  ProjectType,
  ProposalStatus,
  SaleType,
  ServiceType,
  Temperature,
} from '@prisma/client';
import { normalizeKey } from './xlsx-utils';

/**
 * Todos os mapeamentos abaixo foram construídos a partir dos valores REAIS
 * encontrados em CONTROLE_FINANCEIRO_AMBIENS.xlsm (não são um chute
 * genérico) — ver docs/IMPORTACAO_PLANILHA.md para a lista completa de
 * valores observados e a justificativa de cada aproximação.
 */

function buildLookup<T extends string>(pairs: [string, T][]): (raw: string | null) => T | null {
  const table = new Map(pairs.map(([key, value]) => [normalizeKey(key), value]));
  return (raw) => {
    if (raw === null) return null;
    return table.get(normalizeKey(raw)) ?? null;
  };
}

// "Tipo" da aba Lançamentos = grupo do plano de contas.
export const mapEntryGroup = buildLookup<ChartAccountGroup>([
  ['Receitas', ChartAccountGroup.RECEITA],
  ['Custo Fixo', ChartAccountGroup.CUSTO_FIXO],
  ['Despesa Fixa', ChartAccountGroup.DESPESA_FIXA],
  ['Custo Variável', ChartAccountGroup.CUSTO_VARIAVEL],
  ['Despesa Variável', ChartAccountGroup.DESPESA_VARIAVEL],
  ['Bonificação', ChartAccountGroup.BONIFICACAO],
  ['Investimentos', ChartAccountGroup.INVESTIMENTO],
]);

export const CADASTRO_CONTAS_GROUP_COLUMNS: Record<string, ChartAccountGroup> = {
  Receitas: ChartAccountGroup.RECEITA,
  'Custo Fixo': ChartAccountGroup.CUSTO_FIXO,
  'Despesa Fixa': ChartAccountGroup.DESPESA_FIXA,
  'Custo Variável': ChartAccountGroup.CUSTO_VARIAVEL,
  'Despesa Variável': ChartAccountGroup.DESPESA_VARIAVEL,
  Bonificação: ChartAccountGroup.BONIFICACAO,
  Investimentos: ChartAccountGroup.INVESTIMENTO,
};

// Etapa do funil: a planilha real espalha essa informação entre as colunas
// "Status", "Etapas" e "Situação da proposta" em vez de uma única coluna com
// os 8 valores do nosso enum — ver resolveFunnelStage() em importers.ts, que
// aplica esta prioridade sobre os três campos.
export const mapStatusToFunnelStage = buildLookup<FunnelStage>([
  ['ENTREGUE', FunnelStage.ENTREGUE],
  ['NÃO INICIADA', FunnelStage.NAO_INICIADA],
]);

export const mapEtapaToFunnelStage = buildLookup<FunnelStage>([
  ['Follow', FunnelStage.FOLLOW],
  ['Finalizado', FunnelStage.FINALIZADO],
  ['Ag. Pagamento Único', FunnelStage.AG_PAGAMENTO_UNICO],
  ['Ag. Pagamento Risco', FunnelStage.AG_PAGAMENTO_RISCO],
  // "Success" não existe no nosso enum de etapas (só Risco); aproximamos
  // para AG_PAGAMENTO_RISCO por ser a etapa de recebimento variável mais
  // próxima. "Aguardando Pagamento" é genérico na planilha — resolvido à
  // parte por resolveFunnelStage() usando o tipo de venda do job.
  ['Ag. Pagamento Success', FunnelStage.AG_PAGAMENTO_RISCO],
]);

export const mapSituacaoPropostaToAjuste = buildLookup<FunnelStage>([
  ['Ajuste com custo', FunnelStage.AJUSTE],
  ['Pacote de ajustes', FunnelStage.AJUSTE],
]);

export const mapConcorrencia = buildLookup<CompetitionStatus>([
  ['Concorrência', CompetitionStatus.CONCORRENCIA],
  ['job fechado', CompetitionStatus.JOB_FECHADO],
]);

export const mapTemperature = buildLookup<Temperature>([
  ['GO!', Temperature.GO],
  ['Go', Temperature.GO],
  ['morno', Temperature.MORNO],
  ['quente', Temperature.QUENTE],
  ['frio', Temperature.FRIO],
]);

export const mapProjectType = buildLookup<ProjectType>([
  ['Regular', ProjectType.REGULAR],
  ['Queima roupa', ProjectType.QUEIMA_ROUPA],
  ['Buraco negro', ProjectType.BURACO_NEGRO],
]);

export const mapProduct = buildLookup<ProductType>([
  ['Cenografia Fisica', ProductType.CENOGRAFIA_FISICA],
  ['Cenografia Física', ProductType.CENOGRAFIA_FISICA],
  ['Arquitetura', ProductType.ARQUITETURA],
]);

export const mapEventType = buildLookup<EventType>([
  ['Estande', EventType.ESTANDE],
  ['Festival', EventType.FESTIVAL],
  ['Evento', EventType.EVENTO],
  ['Quiosque', EventType.QUIOSQUE],
]);

export const mapProjectSize = buildLookup<ProjectSize>([
  ['P', ProjectSize.P],
  ['M', ProjectSize.M],
  ['G', ProjectSize.G],
  ['GG', ProjectSize.GG],
]);

export const mapProposalStatus = buildLookup<ProposalStatus>([
  ['Proposta aprovada', ProposalStatus.PROPOSTA_APROVADA],
  ['Proposta reprovada', ProposalStatus.PROPOSTA_REPROVADA],
  ['Ajuste sem custo', ProposalStatus.AJUSTE_SEM_CUSTO],
  // "Caiu por verba" não tem equivalente exato — tratamos como proposta
  // reprovada (motivo: orçamento), a leitura mais próxima do enum atual.
  ['Caiu por verba', ProposalStatus.PROPOSTA_REPROVADA],
]);

export const mapSaleType = buildLookup<SaleType>([
  ['Valor Único', SaleType.VALOR_UNICO],
  ['Valor único', SaleType.VALOR_UNICO],
  ['Risco + Success', SaleType.RISCO_SUCCESS],
  ['Risco + Sucess', SaleType.RISCO_SUCCESS],
  ['Ajuste', SaleType.AJUSTE],
]);

export const mapJobResult = buildLookup<JobResult>([
  ['Ganhou com success', JobResult.GANHOU_COM_SUCCESS],
  ['Ganhou sem success', JobResult.GANHOU_SEM_SUCCESS],
  ['Perdeu', JobResult.PERDEU],
  ['Cancelado', JobResult.CANCELADO],
  ['Aguardando retorno', JobResult.AGUARDANDO_RETORNO],
  // "Sem concorrência" não é um resultado do nosso enum (descreve a
  // disputa, não o desfecho) — sem informação melhor, cai em aguardando.
  ['Sem concorrência', JobResult.AGUARDANDO_RETORNO],
]);

const SERVICE_TOKEN_MAP = buildLookup<ServiceType>([
  ['Criação', ServiceType.CRIACAO],
  ['Alteração', ServiceType.ALTERACAO],
  ['Executivo', ServiceType.EXECUTIVO],
  ['Vídeo', ServiceType.VIDEO],
]);

export function mapServices(raw: string | null): ServiceType[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((token) => SERVICE_TOKEN_MAP(token.trim()))
    .filter((v): v is ServiceType => v !== null);
}

const DELIVERABLE_TOKEN_MAP = buildLookup<Deliverable>([
  ['3D', Deliverable.MODELO_3D],
  ['PLANTA', Deliverable.PLANTA],
  ['DESCRITIVO', Deliverable.DESCRITIVO],
  ['VÍDEO', Deliverable.VIDEO],
  ['VIDEO', Deliverable.VIDEO],
]);

export function mapDeliverables(raw: string | null): Deliverable[] {
  if (!raw) return [];
  return raw
    .split('+')
    .map((token) => DELIVERABLE_TOKEN_MAP(token.trim()))
    .filter((v): v is Deliverable => v !== null);
}

export function mapJobType(raw: string | null): JobType {
  const normalized = raw ? normalizeKey(raw) : '';
  if (normalized === 'VERSAO' || normalized === 'VERSÃO') return JobType.VERSAO;
  if (normalized === 'PACOTE') return JobType.PACOTE;
  return JobType.JOB;
}
