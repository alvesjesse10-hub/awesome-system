import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CHART_ACCOUNT_GROUP_LABELS, type ChartOfAccount } from '@/types/chart-of-account'

const QUERY_KEY = ['chart-of-accounts']

function useChartOfAccounts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ChartOfAccount[]>('/chart-of-accounts', {
        params: { includeInactive: true },
      })
      return data
    },
  })
}

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Ocorreu um erro inesperado.'
}

interface EditingState {
  mode: 'create' | 'edit'
  group: ChartOfAccount['group']
  account?: ChartOfAccount
}

export function ChartOfAccountsPage() {
  const { data, isLoading } = useChartOfAccounts()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; group: string; parentId: string }) => {
      await apiClient.post('/chart-of-accounts', input)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: { name: string; isActive: boolean } }) => {
      await apiClient.patch(`/chart-of-accounts/${id}`, input)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/chart-of-accounts/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  function openCreate(group: ChartOfAccount['group']) {
    setEditing({ mode: 'create', group })
    setName('')
    setErrorMessage(null)
  }

  function openEdit(account: ChartOfAccount) {
    setEditing({ mode: 'edit', group: account.group, account })
    setName(account.name)
    setIsActive(String(account.isActive))
    setErrorMessage(null)
  }

  async function handleSubmit() {
    if (!editing) return
    setErrorMessage(null)
    try {
      if (editing.mode === 'create') {
        await createMutation.mutateAsync({ name, group: editing.group, parentId: rootByGroup[editing.group]!.id })
      } else if (editing.account) {
        await updateMutation.mutateAsync({ id: editing.account.id, input: { name, isActive: isActive === 'true' } })
      }
      setEditing(null)
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    }
  }

  async function handleDelete(account: ChartOfAccount) {
    if (!window.confirm(`Excluir a categoria "${account.name}"? Isso só é possível se não houver lançamentos vinculados.`)) {
      return
    }
    try {
      await deleteMutation.mutateAsync(account.id)
    } catch (error) {
      window.alert(extractErrorMessage(error))
    }
  }

  const roots = (data ?? []).filter((account) => account.parentId === null)
  const rootByGroup = Object.fromEntries(roots.map((root) => [root.group, root])) as Record<
    ChartOfAccount['group'],
    ChartOfAccount | undefined
  >

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Plano de Contas</h1>
        <p className="text-sm text-muted-foreground">
          Compartilhado entre todas as empresas do grupo. Os 7 grupos são fixos; as subcategorias são editáveis.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {roots.map((root) => (
          <Card key={root.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                {CHART_ACCOUNT_GROUP_LABELS[root.group]}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => openCreate(root.group)}>
                <Plus className="size-4" />
                Nova subcategoria
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {root.children.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma subcategoria.</p>}
              {root.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary/40">
                  <span className={child.isActive ? '' : 'text-muted-foreground line-through'}>{child.name}</span>
                  <div className="flex items-center gap-1">
                    {!child.isActive && <Badge>Inativo</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(child)} aria-label="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(child)} aria-label="Excluir">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.mode === 'create'
                ? `Nova subcategoria em ${editing ? CHART_ACCOUNT_GROUP_LABELS[editing.group] : ''}`
                : 'Editar subcategoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {editing?.mode === 'edit' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-status">Status</Label>
                <Select id="category-status" value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </Select>
              </div>
            )}
            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || !name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
