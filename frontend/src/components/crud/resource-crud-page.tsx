import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useCompanyCreate, useCompanyDelete, useCompanyList, useCompanyUpdate } from '@/hooks/use-company-resource'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceFormDialog } from './resource-form-dialog'
import type { ColumnConfig, FieldConfig } from './field-config'

interface ResourceCrudPageProps<T extends { id: string }> {
  title: string
  resource: string
  columns: ColumnConfig<T>[]
  fields: FieldConfig[]
  emptyDefaults: Record<string, unknown>
  entityLabel: string
}

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Ocorreu um erro inesperado.'
}

export function ResourceCrudPage<T extends { id: string }>({
  title,
  resource,
  columns,
  fields,
  emptyDefaults,
  entityLabel,
}: ResourceCrudPageProps<T>) {
  const { data, isLoading } = useCompanyList<T[]>(resource)
  const createMutation = useCompanyCreate<Record<string, unknown>>(resource)
  const updateMutation = useCompanyUpdate<Record<string, unknown>>(resource)
  const deleteMutation = useCompanyDelete(resource)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function openCreateDialog() {
    setEditing(null)
    setErrorMessage(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: T) {
    setEditing(item)
    setErrorMessage(null)
    setDialogOpen(true)
  }

  async function handleSubmit(values: Record<string, unknown>) {
    setErrorMessage(null)
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      setDialogOpen(false)
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    }
  }

  async function handleDelete(item: T) {
    if (!window.confirm(`Excluir ${entityLabel.toLowerCase()} "${(item as Record<string, unknown>).name ?? ''}"?`)) {
      return
    }
    try {
      await deleteMutation.mutateAsync(item.id)
    } catch (error) {
      window.alert(extractErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Novo {entityLabel.toLowerCase()}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-6 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="py-6 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
            {data?.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? '—')}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} aria-label="Editar">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} aria-label="Excluir">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Editar ${entityLabel.toLowerCase()}` : `Novo ${entityLabel.toLowerCase()}`}
        fields={fields}
        defaultValues={editing ? { ...emptyDefaults, ...editing } : emptyDefaults}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={errorMessage}
        isEditing={!!editing}
      />
    </div>
  )
}
