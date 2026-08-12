import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: string
  sublabel?: string
  tone?: 'default' | 'good' | 'critical'
}

const TONE_CLASS: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-foreground',
  good: 'text-success',
  critical: 'text-destructive',
}

export function StatTile({ label, value, sublabel, tone = 'default' }: StatTileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-semibold tabular-nums', TONE_CLASS[tone])}>{value}</p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  )
}
