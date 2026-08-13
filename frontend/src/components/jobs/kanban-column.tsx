import { useDroppable } from '@dnd-kit/core'
import { JobCard } from './job-card'
import { formatCurrency } from '@/lib/utils'
import { FUNNEL_STAGE_LABELS, type Job, type PipelineBucket } from '@/types/job'

export function KanbanColumn({
  bucket,
  onJobClick,
  onGenerateEntry,
  onDelete,
}: {
  bucket: PipelineBucket
  onJobClick: (jobId: string) => void
  onGenerateEntry: (job: Job) => void
  onDelete: (job: Job) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.stage })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-secondary/30 p-2 transition-colors ${
        isOver ? 'bg-secondary/60 ring-2 ring-ring' : ''
      }`}
    >
      <div className="flex items-center justify-between px-1 pt-1">
        <h3 className="text-sm font-semibold text-foreground">{FUNNEL_STAGE_LABELS[bucket.stage]}</h3>
        <span className="text-xs text-muted-foreground">{bucket.count}</span>
      </div>
      {bucket.totalValue > 0 && (
        <p className="px-1 text-xs text-muted-foreground">{formatCurrency(bucket.totalValue)}</p>
      )}
      <div className="flex min-h-16 flex-col gap-2">
        {bucket.jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => onJobClick(job.id)}
            onGenerateEntry={() => onGenerateEntry(job)}
            onDelete={() => onDelete(job)}
          />
        ))}
      </div>
    </div>
  )
}
