import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { BankBalancesReport, CashFlowReport, DreReport } from '@/types/reports'

// `scopeId`: id de uma empresa específica, ou null para visão consolidada
// (agrega todas as empresas do usuário — omite o header X-Company-Id, que o
// CompanyScopeGuard do backend interpreta como "consolidado"). Independente
// da empresa ativa global, para permitir alternar sem trocar o app inteiro.

export function useScopedDre(scopeId: string | null, year: number) {
  return useQuery({
    queryKey: ['reports', 'dre', 'scoped', scopeId, year],
    queryFn: async () =>
      (
        await apiClient.get<DreReport>('/reports/dre', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedCashFlow(scopeId: string | null, year: number) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', 'scoped', scopeId, year],
    queryFn: async () =>
      (
        await apiClient.get<CashFlowReport>('/reports/cash-flow', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedBankBalances(scopeId: string | null) {
  return useQuery({
    queryKey: ['reports', 'bank-balances', 'scoped', scopeId],
    queryFn: async () =>
      (
        await apiClient.get<BankBalancesReport>('/reports/bank-balances', {
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}
