import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import type { RevenueGoalComparisonRow, RevenueProjectionComparisonRow } from '@/types/revenue-planning'

/**
 * As tabelas de Metas/Projeções em si usam o CRUD genérico (useCompanyList
 * etc.), mas o endpoint de comparação (meta/projeção x realizado por mês) é
 * um GET à parte, escopado por ano — daqui os hooks dedicados.
 */
export function useRevenueGoalsComparison(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id

  return useQuery({
    queryKey: ['revenue-goals', 'comparison', companyId, year],
    enabled: !!companyId,
    queryFn: async () =>
      (await apiClient.get<RevenueGoalComparisonRow[]>('/revenue-goals/comparison', { params: { year } })).data,
  })
}

export function useRevenueProjectionsComparison(year: number) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id

  return useQuery({
    queryKey: ['revenue-projections', 'comparison', companyId, year],
    enabled: !!companyId,
    queryFn: async () =>
      (await apiClient.get<RevenueProjectionComparisonRow[]>('/revenue-projections/comparison', { params: { year } })).data,
  })
}
