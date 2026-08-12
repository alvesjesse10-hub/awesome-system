import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import type {
  AccountsPayableSummary,
  BankBalancesReport,
  CashFlowReport,
  DreReport,
  RevenueGoalComparisonRow,
  RevenueProjectionComparisonRow,
} from '@/types/reports'

// Hooks escopados pela empresa ATIVA global (seletor do topo) — usados nos
// dashboards Geral, Projetos e Contas a Pagar. Para o dashboard Financeiro
// (que precisa alternar entre uma empresa específica e "consolidado",
// independente da empresa ativa global), ver use-scoped-reports.ts.

export function useDre(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['reports', 'dre', companyId, year],
    enabled: !!companyId,
    queryFn: async () => (await apiClient.get<DreReport>('/reports/dre', { params: { year } })).data,
  })
}

export function useCashFlow(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['reports', 'cash-flow', companyId, year],
    enabled: !!companyId,
    queryFn: async () => (await apiClient.get<CashFlowReport>('/reports/cash-flow', { params: { year } })).data,
  })
}

export function useBankBalances() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['reports', 'bank-balances', companyId],
    enabled: !!companyId,
    queryFn: async () => (await apiClient.get<BankBalancesReport>('/reports/bank-balances')).data,
  })
}

export function useAccountsPayable(nature: 'REVENUE' | 'EXPENSE' = 'EXPENSE') {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['reports', 'accounts-payable', companyId, nature],
    enabled: !!companyId,
    queryFn: async () =>
      (await apiClient.get<AccountsPayableSummary>('/reports/accounts-payable', { params: { nature } })).data,
  })
}

export function useRevenueGoalComparison(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['revenue-goals', 'comparison', companyId, year],
    enabled: !!companyId,
    queryFn: async () =>
      (await apiClient.get<RevenueGoalComparisonRow[]>('/revenue-goals/comparison', { params: { year } })).data,
  })
}

export function useRevenueProjectionComparison(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  return useQuery({
    queryKey: ['revenue-projections', 'comparison', companyId, year],
    enabled: !!companyId,
    queryFn: async () =>
      (await apiClient.get<RevenueProjectionComparisonRow[]>('/revenue-projections/comparison', { params: { year } }))
        .data,
  })
}
