import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatTile } from '@/components/dashboard/stat-tile'
import { StageFunnelChart } from '@/components/dashboard/stage-funnel-chart'
import { CountBarList } from '@/components/dashboard/count-bar-list'
import { formatCurrency } from '@/lib/utils'
import { RESULT_LABELS, type Job, type JobResult, type PipelineBucket } from '@/types/job'

function usePipeline(companyId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'pipeline', companyId],
    enabled: !!companyId,
    queryFn: async () => (await apiClient.get<PipelineBucket[]>('/jobs/pipeline')).data,
  })
}

function useAllJobs(companyId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'list-all', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Job[]; total: number }>('/jobs', { params: { pageSize: 200 } })
      return data.items
    },
  })
}

const WON_RESULTS: JobResult[] = ['GANHOU_COM_SUCCESS', 'GANHOU_SEM_SUCCESS']

export function ProjectsDashboardPage() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  const pipeline = usePipeline(companyId)
  const jobsQuery = useAllJobs(companyId)
  const jobs = jobsQuery.data ?? []

  const conversion = useMemo(() => {
    const total = jobs.length
    const approved = jobs.filter((job) => job.proposalStatus === 'PROPOSTA_APROVADA').length
    const won = jobs.filter((job) => WON_RESULTS.includes(job.result)).length
    return {
      total,
      approved,
      won,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      winRate: total > 0 ? (won / total) * 100 : 0,
    }
  }, [jobs])

  const resultDistribution = useMemo(() => {
    const counts = new Map<JobResult, number>()
    for (const job of jobs) {
      counts.set(job.result, (counts.get(job.result) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([result, count]) => ({ label: RESULT_LABELS[result], count }))
      .sort((a, b) => b.count - a.count)
  }, [jobs])

  const pipelineOpenValue = (pipeline.data ?? [])
    .filter((bucket) => !['FINALIZADO', 'ENTREGUE'].includes(bucket.stage))
    .reduce((sum, bucket) => sum + bucket.totalValue, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard de Projetos</h1>
        <p className="text-sm text-muted-foreground">Funil comercial e conversão de jobs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Jobs no período" value={String(conversion.total)} />
        <StatTile
          label="Propostas aprovadas"
          value={String(conversion.approved)}
          sublabel={`${conversion.approvalRate.toFixed(0)}% do total`}
        />
        <StatTile
          label="Jobs ganhos"
          value={String(conversion.won)}
          sublabel={`${conversion.winRate.toFixed(0)}% do total`}
          tone="good"
        />
        <StatTile label="Valor em pipeline aberto" value={formatCurrency(pipelineOpenValue)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funil por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {pipeline.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <StageFunnelChart buckets={pipeline.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs por resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : resultDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum job cadastrado.</p>
            ) : (
              <CountBarList items={resultDistribution} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
