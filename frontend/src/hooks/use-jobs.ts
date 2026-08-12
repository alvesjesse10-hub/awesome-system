import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import type { FunnelStage, PipelineBucket } from '@/types/job'

export function usePipeline() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id

  return useQuery({
    queryKey: ['jobs', 'pipeline', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<PipelineBucket[]>('/jobs/pipeline')
      return data
    },
  })
}

export function useUpdateJobStage() {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, funnelStage }: { id: string; funnelStage: FunnelStage }) => {
      await apiClient.patch(`/jobs/${id}/stage`, { funnelStage })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'pipeline', activeCompany?.id] }),
  })
}

export function useCreateJob() {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post('/jobs', input)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'pipeline', activeCompany?.id] }),
  })
}

export function useUpdateJob() {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Record<string, unknown> }) => {
      const { data } = await apiClient.patch(`/jobs/${id}`, input)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'pipeline', activeCompany?.id] }),
  })
}

export function useDeleteJob() {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/jobs/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'pipeline', activeCompany?.id] }),
  })
}

export function useGenerateJobEntry() {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: Record<string, unknown> }) => {
      const { data } = await apiClient.post(`/jobs/${id}/generate-entry`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-entries'] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'pipeline', activeCompany?.id] })
    },
  })
}
