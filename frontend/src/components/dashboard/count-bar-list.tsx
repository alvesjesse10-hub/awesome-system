import { CHART_COLORS } from '@/lib/chart-colors'

interface CountBarListProps {
  items: { label: string; count: number }[]
  formatValue?: (value: number) => string
}

/** Lista simples de contagem/valor por categoria — não precisa de gráfico completo para poucas categorias. */
export function CountBarList({ items, formatValue = String }: CountBarListProps) {
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-muted-foreground">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: CHART_COLORS.blue }}
            />
          </div>
          <span className="w-24 shrink-0 text-right tabular-nums text-foreground">{formatValue(item.count)}</span>
        </div>
      ))}
    </div>
  )
}
