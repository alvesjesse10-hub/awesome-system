import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { FinancialEntrySummary, PaginatedResult } from '@/types/financial-entry'

// Toda query escopada por empresa PRECISA incluir o companyId na queryKey e
// `enabled: !!companyId` — senão o React Query serve cache da empresa
// anterior ao trocar no CompanySwitcher (o header X-Company-Id muda, mas a
// chave de cache não), mostrando dados da empresa errada.
function useEntriesTotal(companyId: string | undefined, status: 'PENDING' | 'OVERDUE') {
  return useQuery({
    queryKey: ['financial-entries', 'summary', companyId, status],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResult<FinancialEntrySummary>>('/financial-entries', {
        params: { status, pageSize: 1 },
      })
      return data.total
    },
  })
}

function usePipelineOpenValue(companyId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'pipeline-open-value', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ stage: string; count: number; totalValue: number }[]>('/jobs/pipeline')
      const closedStages = new Set(['FINALIZADO', 'ENTREGUE'])
      return data
        .filter((bucket) => !closedStages.has(bucket.stage))
        .reduce((sum, bucket) => sum + bucket.totalValue, 0)
    },
  })
}

function useClientsCount(companyId: string | undefined) {
  return useQuery({
    queryKey: ['clients', 'count', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<unknown[]>('/clients')
      return data.length
    },
  })
}

export function DashboardPage() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  const pending = useEntriesTotal(companyId, 'PENDING')
  const overdue = useEntriesTotal(companyId, 'OVERDUE')
  const pipelineValue = usePipelineOpenValue(companyId)
  const clientsCount = useClientsCount(companyId)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {activeCompany?.tradeName ?? activeCompany?.name ?? 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">Visão geral do período atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos a pagar/receber</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-foreground">
            {pending.isLoading ? '…' : pending.data}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lançamentos atrasados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {overdue.isLoading ? '…' : overdue.data}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valor em pipeline aberto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-foreground">
            {pipelineValue.isLoading ? '…' : formatCurrency(pipelineValue.data ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-foreground">
            {clientsCount.isLoading ? '…' : clientsCount.data}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
