import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadReport, type ReportFormat } from '@/lib/report-export'

interface ExportMenuProps {
  path: string
  params: Record<string, string | number | undefined>
  filenameBase: string
  /** Ex.: `{ 'X-Company-Id': scopeId ?? '' }` — para relatórios com visão consolidada/por empresa independente da empresa ativa global. */
  headers?: Record<string, string>
}

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
]

/** Botões de exportação (CSV/Excel/PDF) para um relatório do backend. */
export function ExportMenu({ path, params, filenameBase, headers }: ExportMenuProps) {
  const [pending, setPending] = useState<ReportFormat | null>(null)

  async function handleExport(format: ReportFormat) {
    setPending(format)
    try {
      await downloadReport(path, params, format, filenameBase, headers)
    } catch {
      window.alert('Não foi possível exportar o relatório.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Download className="size-3.5 text-muted-foreground" aria-hidden="true" />
      {FORMATS.map((f) => (
        <Button
          key={f.value}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleExport(f.value)}
          disabled={pending !== null}
        >
          {pending === f.value ? '...' : f.label}
        </Button>
      ))}
    </div>
  )
}
