import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, CHART_INK } from '@/lib/chart-colors'
import { MONTH_LABELS_SHORT } from '@/lib/date-labels'
import { formatCurrency } from '@/lib/utils'

interface PlanVsRealizedChartProps {
  plannedLabel: string
  planned: number[]
  realized: number[]
}

/** Barras lado a lado (planejado x realizado) — mesmo eixo de valor, nunca dois eixos. */
export function PlanVsRealizedChart({ plannedLabel, planned, realized }: PlanVsRealizedChartProps) {
  const data = MONTH_LABELS_SHORT.map((month, i) => ({
    month,
    [plannedLabel]: planned[i] ?? 0,
    Realizado: realized[i] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
        <XAxis dataKey="month" stroke={CHART_INK.muted} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_INK.axis }} />
        <YAxis
          stroke={CHART_INK.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value)}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey={plannedLabel} fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Realizado" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
