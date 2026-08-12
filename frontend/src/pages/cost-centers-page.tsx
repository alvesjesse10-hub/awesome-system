import { Badge } from '@/components/ui/badge'
import { ResourceCrudPage } from '@/components/crud/resource-crud-page'
import type { CostCenter } from '@/types/entities'

const columns = [
  { key: 'name', label: 'Nome' },
  {
    key: 'isActive',
    label: 'Status',
    render: (item: CostCenter) => (
      <Badge variant={item.isActive ? 'success' : 'default'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge>
    ),
  },
]

const fields = [{ name: 'name', label: 'Nome', type: 'text' as const, required: true }]

export function CostCentersPage() {
  return (
    <ResourceCrudPage<CostCenter>
      title="Centros de Custo"
      entityLabel="Centro de custo"
      resource="cost-centers"
      columns={columns}
      fields={fields}
      emptyDefaults={{ name: '' }}
    />
  )
}
