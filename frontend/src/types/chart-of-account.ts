export type ChartAccountGroup =
  | 'RECEITA'
  | 'CUSTO_FIXO'
  | 'DESPESA_FIXA'
  | 'CUSTO_VARIAVEL'
  | 'DESPESA_VARIAVEL'
  | 'BONIFICACAO'
  | 'INVESTIMENTO'

export interface ChartOfAccount {
  id: string
  parentId: string | null
  name: string
  group: ChartAccountGroup
  isActive: boolean
  children: ChartOfAccount[]
}

export const CHART_ACCOUNT_GROUP_LABELS: Record<ChartAccountGroup, string> = {
  RECEITA: 'Receita',
  CUSTO_FIXO: 'Custo Fixo',
  DESPESA_FIXA: 'Despesa Fixa',
  CUSTO_VARIAVEL: 'Custo Variável',
  DESPESA_VARIAVEL: 'Despesa Variável',
  BONIFICACAO: 'Bonificação',
  INVESTIMENTO: 'Investimento',
}
