import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isAxiosError } from 'axios'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCompanyList } from '@/hooks/use-company-resource'
import { useCreateJob, useUpdateJob } from '@/hooks/use-jobs'
import type { Client, Employee } from '@/types/entities'
import {
  DELIVERABLE_LABELS,
  EVENT_TYPE_LABELS,
  FUNNEL_STAGE_LABELS,
  INVOICING_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_LABELS,
  PROJECT_TYPE_LABELS,
  PROPOSAL_STATUS_LABELS,
  RESULT_LABELS,
  SALE_TYPE_LABELS,
  SERVICE_LABELS,
  TEMPERATURE_LABELS,
  type Deliverable,
  type Job,
  type ServiceType,
} from '@/types/job'

function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }
  return 'Ocorreu um erro inesperado.'
}

interface FormValues {
  name: string
  agency: string
  clientId: string
  brand: string
  contactName: string
  entryDate: string
  proposalEntryDate: string
  eventDate: string
  estimatedBudget: number | ''
  type: string
  competitionStatus: string
  temperature: string
  projectType: string
  product: string
  eventType: string
  projectSize: string
  location: string
  segment: string
  funnelStage: string
  proposalStatus: string
  saleType: string
  result: string
  closedValue: number | ''
  riskValue: number | ''
  successValue: number | ''
  paymentStatus: string
  invoicingStatus: string
  responsibleEmployeeId: string
}

const EMPTY_VALUES: FormValues = {
  name: '',
  agency: '',
  clientId: '',
  brand: '',
  contactName: '',
  entryDate: '',
  proposalEntryDate: '',
  eventDate: '',
  estimatedBudget: '',
  type: 'JOB',
  competitionStatus: 'CONCORRENCIA',
  temperature: 'MORNO',
  projectType: 'REGULAR',
  product: '',
  eventType: '',
  projectSize: '',
  location: '',
  segment: '',
  funnelStage: 'FOLLOW',
  proposalStatus: 'ENVIAR_PROPOSTA',
  saleType: '',
  result: 'AGUARDANDO_RETORNO',
  closedValue: '',
  riskValue: '',
  successValue: '',
  paymentStatus: 'A_PAGAR',
  invoicingStatus: '',
  responsibleEmployeeId: '',
}

function jobToFormValues(job: Job): FormValues {
  return {
    name: job.name,
    agency: job.agency ?? '',
    clientId: job.clientId ?? '',
    brand: job.brand ?? '',
    contactName: job.contactName ?? '',
    entryDate: job.entryDate?.slice(0, 10) ?? '',
    proposalEntryDate: job.proposalEntryDate?.slice(0, 10) ?? '',
    eventDate: job.eventDate?.slice(0, 10) ?? '',
    estimatedBudget: job.estimatedBudget ? Number(job.estimatedBudget) : '',
    type: job.type,
    competitionStatus: job.competitionStatus,
    temperature: job.temperature,
    projectType: job.projectType,
    product: job.product ?? '',
    eventType: job.eventType ?? '',
    projectSize: job.projectSize ?? '',
    location: job.location ?? '',
    segment: job.segment ?? '',
    funnelStage: job.funnelStage,
    proposalStatus: job.proposalStatus,
    saleType: job.saleType ?? '',
    result: job.result,
    closedValue: job.closedValue ? Number(job.closedValue) : '',
    riskValue: job.riskValue ? Number(job.riskValue) : '',
    successValue: job.successValue ? Number(job.successValue) : '',
    paymentStatus: job.paymentStatus,
    invoicingStatus: job.invoicingStatus ?? '',
    responsibleEmployeeId: job.responsibleEmployeeId ?? '',
  }
}

const SERVICE_OPTIONS: ServiceType[] = ['CRIACAO', 'ALTERACAO', 'EXECUTIVO', 'VIDEO']
const DELIVERABLE_OPTIONS: Deliverable[] = ['MODELO_3D', 'PLANTA', 'DESCRITIVO', 'VIDEO']

export function JobFormDialog({
  open,
  onOpenChange,
  job,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: Job | null
}) {
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: EMPTY_VALUES })
  const [service, setService] = useState<ServiceType[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const clients = useCompanyList<Client[]>('clients')
  const employees = useCompanyList<Employee[]>('employees')
  const createMutation = useCreateJob()
  const updateMutation = useUpdateJob()

  useEffect(() => {
    if (open) {
      reset(job ? jobToFormValues(job) : EMPTY_VALUES)
      setService(job?.service ?? [])
      setDeliverables(job?.deliverables ?? [])
      setErrorMessage(null)
    }
  }, [open, job, reset])

  function toggle<T>(list: T[], value: T, setList: (list: T[]) => void) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function onSubmit(values: FormValues) {
    setErrorMessage(null)
    const payload: Record<string, unknown> = {
      name: values.name,
      agency: values.agency || undefined,
      clientId: values.clientId || undefined,
      brand: values.brand || undefined,
      contactName: values.contactName || undefined,
      entryDate: values.entryDate || undefined,
      proposalEntryDate: values.proposalEntryDate || undefined,
      eventDate: values.eventDate || undefined,
      estimatedBudget: values.estimatedBudget === '' ? undefined : Number(values.estimatedBudget),
      type: values.type,
      service,
      competitionStatus: values.competitionStatus,
      temperature: values.temperature,
      projectType: values.projectType,
      product: values.product || undefined,
      eventType: values.eventType || undefined,
      projectSize: values.projectSize || undefined,
      location: values.location || undefined,
      segment: values.segment || undefined,
      deliverables,
      funnelStage: values.funnelStage,
      proposalStatus: values.proposalStatus,
      saleType: values.saleType || undefined,
      result: values.result,
      closedValue: values.closedValue === '' ? undefined : Number(values.closedValue),
      riskValue: values.riskValue === '' ? undefined : Number(values.riskValue),
      successValue: values.successValue === '' ? undefined : Number(values.successValue),
      paymentStatus: values.paymentStatus,
      invoicingStatus: values.invoicingStatus || undefined,
      responsibleEmployeeId: values.responsibleEmployeeId || undefined,
    }

    try {
      if (job) {
        await updateMutation.mutateAsync({ id: job.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (error) {
      setErrorMessage(extractErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{job ? 'Editar job' : 'Novo job'}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <section className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Nome do projeto/evento</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Agência</Label>
              <Input {...register('agency')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Cliente</Label>
              <Select {...register('clientId')}>
                <option value="">—</option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Marca</Label>
              <Input {...register('brand')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Contato</Label>
              <Input {...register('contactName')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Data de entrada</Label>
              <Input type="date" {...register('entryDate')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Data da proposta</Label>
              <Input type="date" {...register('proposalEntryDate')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Data do evento</Label>
              <Input type="date" {...register('eventDate')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Budget estimado (R$)</Label>
              <Input type="number" step="0.01" {...register('estimatedBudget', { valueAsNumber: true })} />
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select {...register('type')}>
                {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Temperatura</Label>
              <Select {...register('temperature')}>
                {Object.entries(TEMPERATURE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo de projeto</Label>
              <Select {...register('projectType')}>
                {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Produto</Label>
              <Select {...register('product')}>
                <option value="">—</option>
                {Object.entries(PRODUCT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo de evento</Label>
              <Select {...register('eventType')}>
                <option value="">—</option>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tamanho</Label>
              <Select {...register('projectSize')}>
                <option value="">—</option>
                {['P', 'M', 'G', 'GG'].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Local</Label>
              <Input {...register('location')} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Segmento</Label>
              <Input {...register('segment')} />
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              <Label>Serviço</Label>
              <div className="flex flex-wrap gap-3">
                {SERVICE_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={service.includes(option)}
                      onChange={() => toggle(service, option, setService)}
                    />
                    {SERVICE_LABELS[option]}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              <Label>Entregáveis</Label>
              <div className="flex flex-wrap gap-3">
                {DELIVERABLE_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={deliverables.includes(option)}
                      onChange={() => toggle(deliverables, option, setDeliverables)}
                    />
                    {DELIVERABLE_LABELS[option]}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-2">
              <Label>Etapa do funil</Label>
              <Select {...register('funnelStage')}>
                {Object.entries(FUNNEL_STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Situação da proposta</Label>
              <Select {...register('proposalStatus')}>
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo de venda</Label>
              <Select {...register('saleType')}>
                <option value="">—</option>
                {Object.entries(SALE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Resultado</Label>
              <Select {...register('result')}>
                {Object.entries(RESULT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valor fechado (R$)</Label>
              <Input type="number" step="0.01" {...register('closedValue', { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valor de risco (R$)</Label>
              <Input type="number" step="0.01" {...register('riskValue', { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Valor de success (R$)</Label>
              <Input type="number" step="0.01" {...register('successValue', { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Situação de pagamento</Label>
              <Select {...register('paymentStatus')}>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Situação de faturamento</Label>
              <Select {...register('invoicingStatus')}>
                <option value="">—</option>
                {Object.entries(INVOICING_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Responsável</Label>
              <Select {...register('responsibleEmployeeId')}>
                <option value="">—</option>
                {employees.data?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
