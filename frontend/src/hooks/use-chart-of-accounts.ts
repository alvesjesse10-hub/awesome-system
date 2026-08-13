import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ChartOfAccount } from '@/types/chart-of-account'

/** Plano de contas é compartilhado entre empresas — não é escopado por companyId. */
export function useChartOfAccountLeaves() {
  return useQuery({
    queryKey: ['chart-of-accounts', 'leaves'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChartOfAccount[]>('/chart-of-accounts')
      return data.filter((account) => account.parentId !== null)
    },
  })
}
