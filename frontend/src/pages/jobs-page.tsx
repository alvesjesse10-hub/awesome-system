import { useState } from 'react'
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { KanbanColumn } from '@/components/jobs/kanban-column'
import { JobFormDialog } from '@/components/jobs/job-form-dialog'
import { GenerateEntryDialog } from '@/components/jobs/generate-entry-dialog'
import { usePipeline, useDeleteJob, useUpdateJobStage } from '@/hooks/use-jobs'
import type { ChartOfAccount } from '@/types/chart-of-account'
import { FUNNEL_STAGES, type FunnelStage, type Job } from '@/types/job'

function useRevenueAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts', 'revenue-leaves'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChartOfAccount[]>('/chart-of-accounts', { params: { group: 'RECEITA' } })
      return data.filter((account) => account.parentId !== null)
    },
  })
}

export function JobsPage() {
  const pipeline = usePipeline()
  const revenueAccounts = useRevenueAccounts()
  const updateStage = useUpdateJobStage()
  const deleteJob = useDeleteJob()

  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [entryJob, setEntryJob] = useState<Job | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allJobs = pipeline.data?.flatMap((bucket) => bucket.jobs) ?? []

  function openCreate() {
    setEditingJob(null)
    setFormOpen(true)
  }

  function openEdit(jobId: string) {
    const job = allJobs.find((j) => j.id === jobId)
    if (job) {
      setEditingJob(job)
      setFormOpen(true)
    }
  }

  function handleDelete(job: Job) {
    if (window.confirm(`Excluir o job "${job.name}"?`)) {
      deleteJob.mutate(job.id)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStage = over.id as FunnelStage
    const job = allJobs.find((j) => j.id === active.id)
    if (job && job.funnelStage !== newStage) {
      updateStage.mutate({ id: job.id, funnelStage: newStage })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Jobs / Projetos</h1>
          <p className="text-sm text-muted-foreground">Arraste os cards entre as etapas do funil comercial.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo job
        </Button>
      </div>

      {pipeline.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {FUNNEL_STAGES.map((stage) => {
            const bucket = pipeline.data?.find((b) => b.stage === stage) ?? { stage, count: 0, totalValue: 0, jobs: [] }
            return (
              <KanbanColumn
                key={stage}
                bucket={bucket}
                onJobClick={openEdit}
                onGenerateEntry={setEntryJob}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      </DndContext>

      <JobFormDialog open={formOpen} onOpenChange={setFormOpen} job={editingJob} />
      <GenerateEntryDialog job={entryJob} onClose={() => setEntryJob(null)} revenueAccounts={revenueAccounts.data ?? []} />
    </div>
  )
}
