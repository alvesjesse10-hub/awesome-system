import { ResourceCrudPage } from '@/components/crud/resource-crud-page'
import { formatCurrency } from '@/lib/utils'
import type { Employee } from '@/types/entities'

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'role', label: 'Função' },
  { key: 'email', label: 'E-mail' },
  {
    key: 'commissionValue',
    label: 'Comissão',
    render: (item: Employee) =>
      item.commissionValue == null
        ? '—'
        : item.commissionType === 'PERCENTAGE'
          ? `${item.commissionValue}%`
          : formatCurrency(item.commissionValue),
  },
]

const fields = [
  { name: 'name', label: 'Nome', type: 'text' as const, required: true },
  { name: 'role', label: 'Função', type: 'text' as const, required: true, placeholder: 'Ex.: Projetista, Arquiteta' },
  { name: 'email', label: 'E-mail', type: 'email' as const },
  { name: 'phone', label: 'Telefone', type: 'text' as const },
  { name: 'document', label: 'CPF', type: 'text' as const },
  { name: 'pixKey', label: 'Chave Pix', type: 'text' as const },
  { name: 'baseSalary', label: 'Remuneração fixa', type: 'number' as const, step: '0.01' },
  {
    name: 'commissionType',
    label: 'Tipo de comissão',
    type: 'select' as const,
    options: [
      { value: 'PERCENTAGE', label: 'Percentual (%)' },
      { value: 'FIXED', label: 'Valor fixo (R$)' },
    ],
  },
  { name: 'commissionValue', label: 'Valor da comissão', type: 'number' as const, step: '0.01' },
]

export function EmployeesPage() {
  return (
    <ResourceCrudPage<Employee>
      title="Colaboradores"
      entityLabel="Colaborador"
      resource="employees"
      columns={columns}
      fields={fields}
      emptyDefaults={{
        name: '',
        role: '',
        email: '',
        phone: '',
        document: '',
        pixKey: '',
        baseSalary: '',
        commissionType: 'PERCENTAGE',
        commissionValue: '',
      }}
    />
  )
}
