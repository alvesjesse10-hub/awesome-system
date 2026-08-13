import { apiClient } from './api-client'

export type ReportFormat = 'csv' | 'xlsx' | 'pdf'

/**
 * Baixa um relatório do backend (?format=csv|xlsx|pdf) como arquivo. Usa
 * `apiClient` (não um link direto) porque o endpoint exige o header de
 * autenticação — um `<a href="/api/...">` puro não levaria o token.
 */
export async function downloadReport(
  path: string,
  params: Record<string, string | number | undefined>,
  format: ReportFormat,
  filenameBase: string,
  headers?: Record<string, string>,
): Promise<void> {
  const response = await apiClient.get(path, {
    params: { ...params, format },
    responseType: 'blob',
    headers,
  })

  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameBase}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
