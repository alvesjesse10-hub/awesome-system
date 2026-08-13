export type JobType = 'JOB' | 'VERSAO' | 'PACOTE'
export type ServiceType = 'CRIACAO' | 'ALTERACAO' | 'EXECUTIVO' | 'VIDEO'
export type CompetitionStatus = 'CONCORRENCIA' | 'JOB_FECHADO'
export type Temperature = 'MORNO' | 'GO' | 'QUENTE' | 'FRIO'
export type ProjectType = 'REGULAR' | 'QUEIMA_ROUPA' | 'BURACO_NEGRO'
export type ProductType = 'CENOGRAFIA_FISICA' | 'ARQUITETURA'
export type EventType = 'ESTANDE' | 'FESTIVAL' | 'EVENTO' | 'QUIOSQUE'
export type ProjectSize = 'P' | 'M' | 'G' | 'GG'
export type Deliverable = 'MODELO_3D' | 'PLANTA' | 'DESCRITIVO' | 'VIDEO'
export type FunnelStage =
  | 'FOLLOW'
  | 'PROPOSTA_APROVADA'
  | 'AG_PAGAMENTO_UNICO'
  | 'AG_PAGAMENTO_RISCO'
  | 'FINALIZADO'
  | 'ENTREGUE'
  | 'AJUSTE'
  | 'NAO_INICIADA'
export type ProposalStatus = 'ENVIAR_PROPOSTA' | 'PROPOSTA_APROVADA' | 'PROPOSTA_REPROVADA' | 'AJUSTE_SEM_CUSTO'
export type SaleType = 'VALOR_UNICO' | 'RISCO_SUCCESS' | 'AJUSTE'
export type JobResult = 'GANHOU_COM_SUCCESS' | 'GANHOU_SEM_SUCCESS' | 'PERDEU' | 'CANCELADO' | 'AGUARDANDO_RETORNO'
export type JobPaymentStatus = 'PAGO' | 'A_PAGAR'
export type JobInvoicingStatus = 'EMITIR_NFE' | 'FATURADO_RISCO' | 'FATURADO_TOTAL' | 'NFE_EMITIDA'

export interface Job {
  id: string
  name: string
  agency: string | null
  clientId: string | null
  brand: string | null
  contactName: string | null
  entryDate: string | null
  proposalEntryDate: string | null
  eventDate: string | null
  estimatedBudget: string | null
  type: JobType
  service: ServiceType[]
  competitionStatus: CompetitionStatus
  temperature: Temperature
  projectType: ProjectType
  product: ProductType | null
  eventType: EventType | null
  projectSize: ProjectSize | null
  location: string | null
  segment: string | null
  deliverables: Deliverable[]
  funnelStage: FunnelStage
  proposalStatus: ProposalStatus
  saleType: SaleType | null
  result: JobResult
  closedValue: string | null
  riskValue: string | null
  successValue: string | null
  calculatedCommission: string | null
  paymentStatus: JobPaymentStatus
  invoicingStatus: JobInvoicingStatus | null
  responsibleEmployeeId: string | null
  client: { id: string; name: string } | null
  responsibleEmployee: { id: string; name: string } | null
}

export interface PipelineBucket {
  stage: FunnelStage
  count: number
  totalValue: number
  jobs: Job[]
}

export const FUNNEL_STAGES: FunnelStage[] = [
  'FOLLOW',
  'PROPOSTA_APROVADA',
  'AG_PAGAMENTO_UNICO',
  'AG_PAGAMENTO_RISCO',
  'AJUSTE',
  'FINALIZADO',
  'ENTREGUE',
  'NAO_INICIADA',
]

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  FOLLOW: 'Follow',
  PROPOSTA_APROVADA: 'Proposta Aprovada',
  AG_PAGAMENTO_UNICO: 'Ag. Pagamento Único',
  AG_PAGAMENTO_RISCO: 'Ag. Pagamento Risco',
  FINALIZADO: 'Finalizado',
  ENTREGUE: 'Entregue',
  AJUSTE: 'Ajuste',
  NAO_INICIADA: 'Não iniciada',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  CRIACAO: 'Criação',
  ALTERACAO: 'Alteração',
  EXECUTIVO: 'Executivo',
  VIDEO: 'Vídeo',
}

export const DELIVERABLE_LABELS: Record<Deliverable, string> = {
  MODELO_3D: '3D',
  PLANTA: 'Planta',
  DESCRITIVO: 'Descritivo',
  VIDEO: 'Vídeo',
}

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  MORNO: 'Morno',
  GO: 'Go',
  QUENTE: 'Quente',
  FRIO: 'Frio',
}

export const RESULT_LABELS: Record<JobResult, string> = {
  GANHOU_COM_SUCCESS: 'Ganhou com success',
  GANHOU_SEM_SUCCESS: 'Ganhou sem success',
  PERDEU: 'Perdeu',
  CANCELADO: 'Cancelado',
  AGUARDANDO_RETORNO: 'Aguardando retorno',
}

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  VALOR_UNICO: 'Valor Único',
  RISCO_SUCCESS: 'Risco + Success',
  AJUSTE: 'Ajuste',
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  ENVIAR_PROPOSTA: 'Enviar proposta',
  PROPOSTA_APROVADA: 'Proposta aprovada',
  PROPOSTA_REPROVADA: 'Proposta reprovada',
  AJUSTE_SEM_CUSTO: 'Ajuste sem custo',
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  JOB: 'Job',
  VERSAO: 'Versão',
  PACOTE: 'Pacote',
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  REGULAR: 'Regular',
  QUEIMA_ROUPA: 'Queima roupa',
  BURACO_NEGRO: 'Buraco negro',
}

export const PRODUCT_LABELS: Record<ProductType, string> = {
  CENOGRAFIA_FISICA: 'Cenografia Física',
  ARQUITETURA: 'Arquitetura',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ESTANDE: 'Estande',
  FESTIVAL: 'Festival',
  EVENTO: 'Evento',
  QUIOSQUE: 'Quiosque',
}

export const PAYMENT_STATUS_LABELS: Record<JobPaymentStatus, string> = {
  PAGO: 'Pago',
  A_PAGAR: 'A pagar',
}

export const INVOICING_STATUS_LABELS: Record<JobInvoicingStatus, string> = {
  EMITIR_NFE: 'Emitir NFe',
  FATURADO_RISCO: 'Faturado risco',
  FATURADO_TOTAL: 'Faturado total',
  NFE_EMITIDA: 'NFe emitida',
}
