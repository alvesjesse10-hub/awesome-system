import { useState } from 'react'
import { isAxiosError } from 'axios'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCompanyList } from '@/hooks/use-company-resource'
import { useGenerateJobEntry } from '@/hooks/use-jobs'
import type { CostCenter } from '@/types/entities'
import type { ChartOfAccount } from '@/types/chart-of-account'
import type { Job } from '@/types/job'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Ocorreu um erro inesperado.'
}

export function GenerateEntryDialog({
  job,
  onClose,
  revenueAccounts,
}: {
  job: Job | null
  onClose: () => void
  revenueAccounts: ChartOfAccount[]
}) {
  const costCenters = useCompanyList<CostCenter[]>('cost-centers')
  const generateMutation = useGenerateJobEntry()
  const [costCenterId, setCostCenterId] = useState('')
  const [chartOfAccountId, setChartOfAccountId] = useState('')
  const [entryDate, setEntryDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(todayIso())
  const [installments, setInstallments] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit() {
    if (!job) return
    setErrorMessage(null)
    try {
      await generateMutation.mutateAsync({
        id: job.id,
        data: { costCenterId, chartOfAccountId, entryDate, dueDate, installments },
      })
      onClose()
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    }
  }

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar lançamento de receita</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Job: {job?.name}</p>
          <div className="flex flex-col gap-2">
            <Label>Centro de custo</Label>
            <Select value={costCenterId} onChange={(e) => setCostCenterId(e.target.value)}>
              <option value="">Selecione...</option>
              {costCenters.data?.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categoria (Receita)</Label>
            <Select value={chartOfAccountId} onChange={(e) => setChartOfAccountId(e.target.value)}>
              <option value="">Selecione...</option>
              {revenueAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Data de entrada</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Vencimento (1ª parcela)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Nº de parcelas</Label>
            <Input
              type="number"
              min={1}
              max={360}
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            />
          </div>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!costCenterId || !chartOfAccountId || generateMutation.isPending}
            onClick={handleSubmit}
          >
            Gerar lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
