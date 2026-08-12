import { useDraggable } from '@dnd-kit/core'
import { Receipt, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { RESULT_LABELS, TEMPERATURE_LABELS, type Job } from '@/types/job'

const TEMPERATURE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  QUENTE: 'destructive',
  GO: 'warning',
  MORNO: 'default',
  FRIO: 'default',
}

export function JobCard({
  job,
  onClick,
  onGenerateEntry,
  onDelete,
}: {
  job: Job
  onClick: () => void
  onGenerateEntry: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })

  const value = job.saleType === 'RISCO_SUCCESS' ? Number(job.riskValue ?? 0) + Number(job.successValue ?? 0) : Number(job.closedValue ?? 0)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : undefined }
          : undefined
      }
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <Card className={`flex flex-col gap-2 p-3 transition-shadow hover:shadow-md ${isDragging ? 'opacity-70 shadow-lg' : ''}`}>
        <p className="text-sm font-medium text-foreground">{job.name}</p>
        {job.client && <p className="text-xs text-muted-foreground">{job.client.name}</p>}
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={TEMPERATURE_VARIANT[job.temperature]}>{TEMPERATURE_LABELS[job.temperature]}</Badge>
          {job.result !== 'AGUARDANDO_RETORNO' && <Badge>{RESULT_LABELS[job.result]}</Badge>}
        </div>
        {value > 0 && <p className="text-sm font-semibold text-foreground">{formatCurrency(value)}</p>}
        {job.responsibleEmployee && (
          <p className="text-xs text-muted-foreground">Resp.: {job.responsibleEmployee.name}</p>
        )}
        <div className="flex justify-end gap-1 border-t border-border pt-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Gerar lançamento"
            onClick={(e) => {
              e.stopPropagation()
              onGenerateEntry()
            }}
          >
            <Receipt className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
