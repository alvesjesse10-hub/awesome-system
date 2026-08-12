import { ResourceCrudPage } from '@/components/crud/resource-crud-page'
import type { Client } from '@/types/entities'

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'document', label: 'CPF/CNPJ' },
]

const fields = [
  { name: 'name', label: 'Nome', type: 'text' as const, required: true },
  { name: 'email', label: 'E-mail', type: 'email' as const },
  { name: 'phone', label: 'Telefone', type: 'text' as const },
  { name: 'address', label: 'Endereço', type: 'text' as const },
  { name: 'document', label: 'CPF/CNPJ', type: 'text' as const },
]

export function ClientsPage() {
  return (
    <ResourceCrudPage<Client>
      title="Clientes"
      entityLabel="Cliente"
      resource="clients"
      columns={columns}
      fields={fields}
      emptyDefaults={{ name: '', email: '', phone: '', address: '', document: '' }}
    />
  )
}
