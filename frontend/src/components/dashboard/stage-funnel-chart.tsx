import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, CHART_INK } from '@/lib/chart-colors'
import { formatCurrency } from '@/lib/utils'
import { FUNNEL_STAGE_LABELS, type PipelineBucket } from '@/types/job'

export function StageFunnelChart({ buckets }: { buckets: PipelineBucket[] }) {
  const data = buckets.map((bucket) => ({
    stage: FUNNEL_STAGE_LABELS[bucket.stage],
    count: bucket.count,
    value: bucket.totalValue,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHART_INK.grid} />
        <XAxis type="number" allowDecimals={false} stroke={CHART_INK.muted} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="stage"
          stroke={CHART_INK.muted}
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.axis }}
          width={130}
        />
        <Tooltip
          formatter={(value, name) =>
            name === 'count' ? [`${value} job(s)`, 'Quantidade'] : [formatCurrency(Number(value)), 'Valor']
          }
          contentStyle={{ borderRadius: 8, borderColor: CHART_INK.grid, fontSize: 13 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS.blue} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
