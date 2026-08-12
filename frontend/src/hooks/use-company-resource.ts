import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'

/**
 * Hooks para recursos escopados por empresa (a maioria da API). O
 * `companyId` da empresa ativa entra na queryKey e em `enabled` — sem isso,
 * trocar de empresa no seletor do topo mostraria dados em cache da empresa
 * anterior mesmo com o header X-Company-Id correto sendo enviado (ver
 * frontend/README.md).
 */
export function useCompanyList<T>(resource: string) {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id

  return useQuery({
    queryKey: [resource, 'list', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<T>(`/${resource}`)
      return data
    },
  })
}

export function useCompanyCreate<TInput, TOutput = unknown>(resource: string) {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TInput) => {
      const { data } = await apiClient.post<TOutput>(`/${resource}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list', activeCompany?.id] })
    },
  })
}

export function useCompanyUpdate<TInput, TOutput = unknown>(resource: string) {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data: input }: { id: string; data: TInput }) => {
      const { data } = await apiClient.patch<TOutput>(`/${resource}/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list', activeCompany?.id] })
    },
  })
}

export function useCompanyDelete(resource: string) {
  const { activeCompany } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/${resource}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list', activeCompany?.id] })
    },
  })
}
