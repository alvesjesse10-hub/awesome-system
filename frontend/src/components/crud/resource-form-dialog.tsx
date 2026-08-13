import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { FieldConfig } from './field-config'

interface ResourceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fields: FieldConfig[]
  defaultValues: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
  /** Quando true, campos com `disabledOnEdit` ficam travados e são omitidos do payload enviado. */
  isEditing?: boolean
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  defaultValues,
  onSubmit,
  isSubmitting,
  errorMessage,
  isEditing = false,
}: ResourceFormDialogProps) {
  const { register, handleSubmit, reset } = useForm({ defaultValues })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultValues])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(async (values) => {
            // `values` vem com TODAS as chaves de defaultValues (inclusive
            // id/companyId/createdAt vindos do item em edição), não só os
            // campos deste formulário — o backend usa forbidNonWhitelisted
            // e rejeitaria com 400. Reconstrói só com os campos declarados
            // em `fields`, normalizando '' e NaN para undefined. Campos
            // `disabledOnEdit` são omitidos ao editar (alguns recursos, como
            // Metas/Projeções, não aceitam mudar ano/mês/categoria depois de
            // criados — só o valor).
            const sanitized = Object.fromEntries(
              fields
                .filter((field) => !(isEditing && field.disabledOnEdit))
                .map((field) => {
                  const value = (values as Record<string, unknown>)[field.name]
                  if (value === '' || (typeof value === 'number' && Number.isNaN(value))) {
                    return [field.name, undefined]
                  }
                  return [field.name, value]
                }),
            )
            await onSubmit(sanitized)
          })}
        >
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.type === 'select' ? (
                <Select
                  id={field.name}
                  required={field.required}
                  disabled={isEditing && field.disabledOnEdit}
                  {...register(field.name, { required: field.required, valueAsNumber: field.numeric })}
                >
                  {!field.required && <option value="">—</option>}
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  step={field.step}
                  placeholder={field.placeholder}
                  required={field.required}
                  disabled={isEditing && field.disabledOnEdit}
                  {...register(field.name, {
                    required: field.required,
                    valueAsNumber: field.type === 'number' || field.numeric,
                  })}
                />
              )}
            </div>
          ))}
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
