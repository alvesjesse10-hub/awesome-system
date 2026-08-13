import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResourceCrudPage } from '@/components/crud/resource-crud-page'
import { PlanVsRealizedChart } from '@/components/dashboard/plan-vs-realized-chart'
import { useChartOfAccountLeaves } from '@/hooks/use-chart-of-accounts'
import { useRevenueGoalsComparison, useRevenueProjectionsComparison } from '@/hooks/use-revenue-comparison'
import { MONTH_LABELS_FULL, currentYear } from '@/lib/date-labels'
import { formatCurrency } from '@/lib/utils'
import type { RevenueGoal, RevenueProjection } from '@/types/revenue-planning'

const monthOptions = MONTH_LABELS_FULL.map((label, index) => ({ value: String(index + 1), label }))

function monthLabel(month: number) {
  return MONTH_LABELS_FULL[month - 1] ?? String(month)
}

const goalColumns = [
  { key: 'year', label: 'Ano' },
  { key: 'month', label: 'Mês', render: (item: RevenueGoal) => monthLabel(item.month) },
  { key: 'targetAmount', label: 'Meta', render: (item: RevenueGoal) => formatCurrency(item.targetAmount) },
]

// Ano/mês definem a identidade da meta e não são editáveis depois de criada
// (mesma regra do backend — ver UpdateRevenueGoalDto) — só o valor pode
// mudar; para "mover" a meta de mês, exclua e crie de novo.
const goalFields = [
  { name: 'year', label: 'Ano', type: 'number' as const, required: true, disabledOnEdit: true },
  { name: 'month', label: 'Mês', type: 'select' as const, required: true, numeric: true, options: monthOptions, disabledOnEdit: true },
  { name: 'targetAmount', label: 'Valor da meta (R$)', type: 'number' as const, step: '0.01', required: true },
]

const projectionColumns = [
  { key: 'chartOfAccount', label: 'Categoria', render: (item: RevenueProjection) => item.chartOfAccount?.name ?? '—' },
  { key: 'year', label: 'Ano' },
  { key: 'month', label: 'Mês', render: (item: RevenueProjection) => monthLabel(item.month) },
  { key: 'projectedAmount', label: 'Projetado', render: (item: RevenueProjection) => formatCurrency(item.projectedAmount) },
]

export function RevenuePlanningPage() {
  const [year, setYear] = useState(currentYear())
  const chartOfAccounts = useChartOfAccountLeaves()
  const goalsComparison = useRevenueGoalsComparison(year)
  const projectionsComparison = useRevenueProjectionsComparison(year)

  const revenueCategoryOptions = useMemo(
    () =>
      (chartOfAccounts.data ?? [])
        .filter((account) => account.group === 'RECEITA')
        .map((account) => ({ value: account.id, label: account.name })),
    [chartOfAccounts.data],
  )

  // Categoria/ano/mês definem a identidade da projeção e não são editáveis
  // depois de criada (mesma regra do backend — ver
  // UpdateRevenueProjectionDto) — só o valor projetado pode mudar.
  const projectionFields = useMemo(
    () => [
      {
        name: 'chartOfAccountId',
        label: 'Categoria',
        type: 'select' as const,
        required: true,
        options: revenueCategoryOptions,
        disabledOnEdit: true,
      },
      { name: 'year', label: 'Ano', type: 'number' as const, required: true, disabledOnEdit: true },
      { name: 'month', label: 'Mês', type: 'select' as const, required: true, numeric: true, options: monthOptions, disabledOnEdit: true },
      { name: 'projectedAmount', label: 'Valor projetado (R$)', type: 'number' as const, step: '0.01', required: true },
    ],
    [revenueCategoryOptions],
  )

  const goalsTotals = goalsComparison.data
    ? {
        target: goalsComparison.data.reduce((sum, row) => sum + row.target, 0),
        realized: goalsComparison.data.reduce((sum, row) => sum + row.realized, 0),
      }
    : null
  const projectionsTotals = projectionsComparison.data
    ? {
        projected: projectionsComparison.data.reduce((sum, row) => sum + row.projected, 0),
        realized: projectionsComparison.data.reduce((sum, row) => sum + row.realized, 0),
      }
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Metas e Projeções</h1>
          <p className="text-sm text-muted-foreground">Meta de faturamento e projeção de receita por categoria, mês a mês</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="planning-year" className="text-muted-foreground">
            Ano
          </Label>
          <Input
            id="planning-year"
            type="number"
            className="w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || currentYear())}
          />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">Metas de Faturamento</h2>
        <Card>
          <CardHeader>
            <CardTitle>
              Meta x realizado em {year}
              {goalsTotals && (
                <span className="ml-2 font-normal text-foreground">
                  ({formatCurrency(goalsTotals.realized)} de {formatCurrency(goalsTotals.target)})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsComparison.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <PlanVsRealizedChart
                plannedLabel="Meta"
                planned={(goalsComparison.data ?? []).map((row) => row.target)}
                realized={(goalsComparison.data ?? []).map((row) => row.realized)}
              />
            )}
          </CardContent>
        </Card>

        <ResourceCrudPage<RevenueGoal>
          title="Metas cadastradas"
          entityLabel="Meta"
          resource="revenue-goals"
          columns={goalColumns}
          fields={goalFields}
          emptyDefaults={{ year, month: new Date().getMonth() + 1, targetAmount: 0 }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-foreground">Projeções de Receita</h2>
        <Card>
          <CardHeader>
            <CardTitle>
              Projetado x realizado em {year}
              {projectionsTotals && (
                <span className="ml-2 font-normal text-foreground">
                  ({formatCurrency(projectionsTotals.realized)} de {formatCurrency(projectionsTotals.projected)})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectionsComparison.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <PlanVsRealizedChart
                plannedLabel="Projetado"
                planned={(projectionsComparison.data ?? []).map((row) => row.projected)}
                realized={(projectionsComparison.data ?? []).map((row) => row.realized)}
              />
            )}
          </CardContent>
        </Card>

        <ResourceCrudPage<RevenueProjection>
          title="Projeções cadastradas"
          entityLabel="Projeção"
          resource="revenue-projections"
          columns={projectionColumns}
          fields={projectionFields}
          emptyDefaults={{ chartOfAccountId: '', year, month: new Date().getMonth() + 1, projectedAmount: 0 }}
        />
      </section>
    </div>
  )
}
