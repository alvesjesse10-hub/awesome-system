import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Plus, RotateCcw, Trash2, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/context/auth-context'
import { useCompanyList } from '@/hooks/use-company-resource'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Client, CostCenter, Supplier, BankAccount } from '@/types/entities'
import type { ChartOfAccount } from '@/types/chart-of-account'
import { CHART_ACCOUNT_GROUP_LABELS } from '@/types/chart-of-account'
import type { DisplayStatus } from '@/types/financial-entry'
import type { FinancialEntry, FinancialEntryList } from '@/types/financial-entry-full'

const STATUS_LABEL: Record<DisplayStatus, string> = { PAGO: 'Pago', A_PAGAR: 'A pagar', ATRASADO: 'Atrasado' }
const STATUS_VARIANT: Record<DisplayStatus, 'success' | 'default' | 'destructive'> = {
  PAGO: 'success',
  A_PAGAR: 'default',
  ATRASADO: 'destructive',
}

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

function useChartOfAccountLeaves() {
  return useQuery({
    queryKey: ['chart-of-accounts', 'leaves'],
    queryFn: async () => {
      const { data } = await apiClient.get<ChartOfAccount[]>('/chart-of-accounts')
      return data.filter((account) => account.parentId !== null)
    },
  })
}

interface EntryFilters {
  status?: 'PAID' | 'PENDING' | 'OVERDUE'
}

function useFinancialEntries(companyId: string | undefined, filters: EntryFilters) {
  return useQuery({
    queryKey: ['financial-entries', 'list', companyId, filters],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await apiClient.get<FinancialEntryList>('/financial-entries', {
        params: { ...filters, pageSize: 100 },
      })
      return data
    },
  })
}

interface CreateEntryForm {
  partyType: 'client' | 'supplier'
  partyId: string
  costCenterId: string
  chartOfAccountId: string
  invoiceNumber: string
  description: string
  amount: number
  installments: number
  entryDate: string
  dueDate: string
  situacao: string
}

export function FinancialEntriesPage() {
  const { activeCompany } = useAuth()
  const companyId = activeCompany?.id
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<'PAID' | 'PENDING' | 'OVERDUE' | ''>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [payingEntry, setPayingEntry] = useState<FinancialEntry | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filters: EntryFilters = status ? { status } : {}
  const entries = useFinancialEntries(companyId, filters)
  const clients = useCompanyList<Client[]>('clients')
  const suppliers = useCompanyList<Supplier[]>('suppliers')
  const costCenters = useCompanyList<CostCenter[]>('cost-centers')
  const bankAccounts = useCompanyList<BankAccount[]>('bank-accounts')
  const chartOfAccounts = useChartOfAccountLeaves()

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ['financial-entries', 'list', companyId] })

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      await apiClient.post('/financial-entries', input)
    },
    onSuccess: invalidateList,
  })

  const payMutation = useMutation({
    mutationFn: async ({ id, paymentDate, bankAccountId }: { id: string; paymentDate: string; bankAccountId: string }) => {
      await apiClient.post(`/financial-entries/${id}/pay`, { paymentDate, bankAccountId })
    },
    onSuccess: invalidateList,
  })

  const unpayMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/financial-entries/${id}/unpay`)
    },
    onSuccess: invalidateList,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/financial-entries/${id}`)
    },
    onSuccess: invalidateList,
  })

  const { register, handleSubmit, watch, reset } = useForm<CreateEntryForm>({
    defaultValues: {
      partyType: 'client',
      partyId: '',
      costCenterId: '',
      chartOfAccountId: '',
      invoiceNumber: '',
      description: '',
      amount: 0,
      installments: 1,
      entryDate: todayIso(),
      dueDate: todayIso(),
      situacao: '',
    },
  })
  const partyType = watch('partyType')

  const chartAccountsByGroup = useMemo(() => {
    const groups: Record<string, ChartOfAccount[]> = {}
    for (const account of chartOfAccounts.data ?? []) {
      groups[account.group] ??= []
      groups[account.group].push(account)
    }
    return groups
  }, [chartOfAccounts.data])

  function openCreateDialog() {
    reset({
      partyType: 'client',
      partyId: '',
      costCenterId: '',
      chartOfAccountId: '',
      invoiceNumber: '',
      description: '',
      amount: 0,
      installments: 1,
      entryDate: todayIso(),
      dueDate: todayIso(),
      situacao: '',
    })
    setErrorMessage(null)
    setCreateOpen(true)
  }

  async function onCreateSubmit(values: CreateEntryForm) {
    setErrorMessage(null)
    try {
      await createMutation.mutateAsync({
        clientId: values.partyType === 'client' ? values.partyId : undefined,
        supplierId: values.partyType === 'supplier' ? values.partyId : undefined,
        costCenterId: values.costCenterId,
        chartOfAccountId: values.chartOfAccountId,
        invoiceNumber: values.invoiceNumber || undefined,
        description: values.description,
        amount: Number(values.amount),
        installments: Number(values.installments) || 1,
        entryDate: values.entryDate,
        dueDate: values.dueDate,
        situacao: values.situacao || undefined,
      })
      setCreateOpen(false)
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    }
  }

  async function handleDelete(entry: FinancialEntry) {
    if (!window.confirm(`Excluir o lançamento "${entry.description}"?`)) return
    try {
      await deleteMutation.mutateAsync(entry.id)
    } catch (error) {
      window.alert(extractErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lançamentos Financeiros</h1>
          <p className="text-sm text-muted-foreground">Receitas e despesas, com parcelamento e status automático.</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Novo lançamento
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="status-filter" className="text-muted-foreground">
          Status
        </Label>
        <Select
          id="status-filter"
          className="w-40"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="">Todos</option>
          <option value="PENDING">A pagar</option>
          <option value="OVERDUE">Atrasado</option>
          <option value="PAID">Pago</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente/Fornecedor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!entries.isLoading && entries.data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {entries.data?.items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.dueDate)}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.client?.name ?? entry.supplier?.name ?? '—'}</TableCell>
                <TableCell>{entry.chartOfAccount.name}</TableCell>
                <TableCell>
                  {entry.installmentTotal > 1 ? `${entry.installmentNumber}/${entry.installmentTotal}` : '—'}
                </TableCell>
                <TableCell className={`text-right ${entry.nature === 'EXPENSE' ? 'text-destructive' : ''}`}>
                  {formatCurrency(entry.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[entry.displayStatus]}>{STATUS_LABEL[entry.displayStatus]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {entry.status === 'PENDING' ? (
                      <Button variant="ghost" size="icon" aria-label="Pagar" onClick={() => setPayingEntry(entry)}>
                        <Wallet className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Desfazer pagamento"
                        onClick={() => unpayMutation.mutate(entry.id)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => handleDelete(entry)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit(onCreateSubmit)}>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="client" {...register('partyType')} /> Receita (cliente)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="supplier" {...register('partyType')} /> Despesa (fornecedor)
              </label>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label>{partyType === 'client' ? 'Cliente' : 'Fornecedor'}</Label>
              <Select {...register('partyId', { required: true })}>
                <option value="">Selecione...</option>
                {(partyType === 'client' ? clients.data : suppliers.data)?.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Centro de custo</Label>
              <Select {...register('costCenterId', { required: true })}>
                <option value="">Selecione...</option>
                {costCenters.data?.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select {...register('chartOfAccountId', { required: true })}>
                <option value="">Selecione...</option>
                {Object.entries(chartAccountsByGroup).map(([group, accounts]) => (
                  <optgroup key={group} label={CHART_ACCOUNT_GROUP_LABELS[group as keyof typeof CHART_ACCOUNT_GROUP_LABELS]}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label>Descrição</Label>
              <Input {...register('description', { required: true })} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Valor total (R$)</Label>
              <Input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Nº de parcelas</Label>
              <Input type="number" min={1} max={360} {...register('installments', { valueAsNumber: true })} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data de entrada</Label>
              <Input type="date" {...register('entryDate', { required: true })} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Vencimento (1ª parcela)</Label>
              <Input type="date" {...register('dueDate', { required: true })} />
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label>Nº da NF (opcional)</Label>
              <Input {...register('invoiceNumber')} />
            </div>

            <div className="col-span-2 flex flex-col gap-2">
              <Label>Situação (observações)</Label>
              <Input {...register('situacao')} />
            </div>

            {errorMessage && <p className="col-span-2 text-sm text-destructive">{errorMessage}</p>}

            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PayDialog
        entry={payingEntry}
        bankAccounts={bankAccounts.data ?? []}
        onClose={() => setPayingEntry(null)}
        onConfirm={async (paymentDate, bankAccountId) => {
          if (!payingEntry) return
          await payMutation.mutateAsync({ id: payingEntry.id, paymentDate, bankAccountId })
          setPayingEntry(null)
        }}
        isSubmitting={payMutation.isPending}
      />
    </div>
  )
}

function PayDialog({
  entry,
  bankAccounts,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  entry: FinancialEntry | null
  bankAccounts: BankAccount[]
  onClose: () => void
  onConfirm: (paymentDate: string, bankAccountId: string) => Promise<void>
  isSubmitting: boolean
}) {
  const [paymentDate, setPaymentDate] = useState(todayIso())
  const [bankAccountId, setBankAccountId] = useState('')

  useMemo(() => {
    setPaymentDate(todayIso())
    setBankAccountId('')
  }, [entry?.id])

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {entry?.description} — {entry && formatCurrency(entry.amount)}
          </p>
          <div className="flex flex-col gap-2">
            <Label>Data do pagamento</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Conta bancária</Label>
            <Select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
              <option value="">Selecione...</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!bankAccountId || isSubmitting}
            onClick={() => onConfirm(paymentDate, bankAccountId)}
          >
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
