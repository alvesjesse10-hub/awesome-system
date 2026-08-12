import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatTile } from '@/components/dashboard/stat-tile'
import { RevenueExpenseChart } from '@/components/dashboard/revenue-expense-chart'
import { DreSummaryTable } from '@/components/dashboard/dre-summary-table'
import { useAccountsPayable, useDre, useRevenueGoalComparison, useRevenueProjectionComparison } from '@/hooks/use-reports'
import { formatCurrency } from '@/lib/utils'
import { currentMonth, currentYear } from '@/lib/date-labels'
import type { FinancialEntrySummary, PaginatedResult } from '@/types/financial-entry'

const COST_EXPENSE_KEYS = ['CUSTO_FIXO', 'DESPESA_FIXA', 'CUSTO_VARIAVEL', 'DESPESA_VARIAVEL']

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

export function DashboardPage() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  const year = currentYear()
  const month = currentMonth()

  const pending = useEntriesTotal(companyId, 'PENDING')
  const overdue = useEntriesTotal(companyId, 'OVERDUE')
  const pipelineValue = usePipelineOpenValue(companyId)
  const dre = useDre(year)
  const goalComparison = useRevenueGoalComparison(year)
  const projectionComparison = useRevenueProjectionComparison(year)
  const accountsPayable = useAccountsPayable('EXPENSE')

  const currentMonthGoal = goalComparison.data?.[month - 1]
  const currentMonthProjection = projectionComparison.data?.[month - 1]

  const revenueRow = dre.data?.rows.find((row) => row.key === 'RECEITA')
  const expensesByMonth = dre.data
    ? dre.data.rows
        .filter((row) => COST_EXPENSE_KEYS.includes(row.key))
        .reduce((totals, row) => row.months.map((value, i) => totals[i] + value), new Array(12).fill(0))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {activeCompany?.tradeName ?? activeCompany?.name ?? 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">Visão geral do período atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Receita realizada (mês)"
          value={currentMonthGoal ? formatCurrency(currentMonthGoal.realized) : '…'}
        />
        <StatTile
          label="Meta do mês"
          value={currentMonthGoal?.target ? formatCurrency(currentMonthGoal.target) : 'Sem meta'}
          sublabel={
            currentMonthGoal?.achievementPercent != null
              ? `${currentMonthGoal.achievementPercent.toFixed(0)}% atingido`
              : undefined
          }
          tone={
            currentMonthGoal?.achievementPercent != null
              ? currentMonthGoal.achievementPercent >= 100
                ? 'good'
                : 'default'
              : 'default'
          }
        />
        <StatTile
          label="Projeção do mês"
          value={currentMonthProjection?.projected ? formatCurrency(currentMonthProjection.projected) : 'Sem projeção'}
        />
        <StatTile
          label="Valor em pipeline aberto"
          value={pipelineValue.isLoading ? '…' : formatCurrency(pipelineValue.data ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Lançamentos a pagar/receber" value={pending.isLoading ? '…' : String(pending.data)} />
        <StatTile
          label="Lançamentos atrasados"
          value={overdue.isLoading ? '…' : String(overdue.data)}
          tone={overdue.data ? 'critical' : 'default'}
        />
        <StatTile
          label="Contas a pagar (30 dias)"
          value={accountsPayable.isLoading ? '…' : formatCurrency(accountsPayable.data?.dueThisMonth.total ?? 0)}
          sublabel={accountsPayable.data ? `${accountsPayable.data.dueThisMonth.count} conta(s)` : undefined}
        />
        <StatTile
          label="Contas atrasadas"
          value={accountsPayable.isLoading ? '…' : formatCurrency(accountsPayable.data?.overdue.total ?? 0)}
          tone={accountsPayable.data?.overdue.total ? 'critical' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receitas x Despesas — {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {dre.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <RevenueExpenseChart revenue={revenueRow?.months ?? []} expenses={expensesByMonth} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DRE resumido — {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {dre.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <DreSummaryTable rows={dre.data?.rows ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
