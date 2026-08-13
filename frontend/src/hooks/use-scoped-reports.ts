import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  AccountsPayableSummary,
  BankBalancesReport,
  CashFlowReport,
  CommissionRankingRow,
  DreReport,
  JobProfitabilityRow,
  PartyReportRow,
} from '@/types/reports'

// `scopeId`: id de uma empresa específica, ou null para visão consolidada
// (agrega todas as empresas do usuário — omite o header X-Company-Id, que o
// CompanyScopeGuard do backend interpreta como "consolidado"). Independente
// da empresa ativa global, para permitir alternar sem trocar o app inteiro.
//
// `enabled`: a página de Relatórios mostra um relatório por vez, mas os
// hooks de todos são chamados incondicionalmente (regra dos hooks) — usa
// isso para só disparar a requisição do relatório selecionado.

export function useScopedDre(scopeId: string | null, year: number, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'dre', 'scoped', scopeId, year],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<DreReport>('/reports/dre', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedCashFlow(scopeId: string | null, year: number, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', 'scoped', scopeId, year],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<CashFlowReport>('/reports/cash-flow', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedBankBalances(scopeId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'bank-balances', 'scoped', scopeId],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<BankBalancesReport>('/reports/bank-balances', {
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedJobProfitability(scopeId: string | null, year: number, month: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'job-profitability', 'scoped', scopeId, year, month],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<JobProfitabilityRow[]>('/reports/job-profitability', {
          params: { year, month },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedClientsReport(scopeId: string | null, year: number, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'clients', 'scoped', scopeId, year],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<PartyReportRow[]>('/reports/clients', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedSuppliersReport(scopeId: string | null, year: number, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'suppliers', 'scoped', scopeId, year],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<PartyReportRow[]>('/reports/suppliers', {
          params: { year },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedAccountsPayable(
  scopeId: string | null,
  nature: 'REVENUE' | 'EXPENSE',
  enabled = true,
) {
  return useQuery({
    queryKey: ['reports', 'accounts-payable', 'scoped', scopeId, nature],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<AccountsPayableSummary>('/reports/accounts-payable', {
          params: { nature },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}

export function useScopedCommissionRanking(
  scopeId: string | null,
  year: number,
  month: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['reports', 'commission-ranking', 'scoped', scopeId, year, month],
    enabled,
    queryFn: async () =>
      (
        await apiClient.get<CommissionRankingRow[]>('/reports/commission-ranking', {
          params: { year, month },
          headers: { 'X-Company-Id': scopeId ?? '' },
        })
      ).data,
  })
}
