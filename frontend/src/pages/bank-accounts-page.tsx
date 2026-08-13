import { Badge } from '@/components/ui/badge'
import { ResourceCrudPage } from '@/components/crud/resource-crud-page'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/types/entities'

const columns = [
  { key: 'name', label: 'Conta' },
  { key: 'bankName', label: 'Banco' },
  {
    key: 'type',
    label: 'Tipo',
    render: (item: BankAccount) => (
      <Badge variant={item.type === 'INVESTMENT' ? 'warning' : 'default'}>
        {item.type === 'INVESTMENT' ? 'Aplicação' : 'Conta corrente'}
      </Badge>
    ),
  },
  { key: 'initialBalance', label: 'Saldo inicial', render: (item: BankAccount) => formatCurrency(item.initialBalance) },
]

const fields = [
  { name: 'name', label: 'Nome da conta', type: 'text' as const, required: true },
  { name: 'bankName', label: 'Banco', type: 'text' as const },
  {
    name: 'type',
    label: 'Tipo',
    type: 'select' as const,
    options: [
      { value: 'CHECKING', label: 'Conta corrente' },
      { value: 'INVESTMENT', label: 'Aplicação / investimento' },
    ],
  },
  { name: 'initialBalance', label: 'Saldo inicial', type: 'number' as const, step: '0.01' },
]

export function BankAccountsPage() {
  return (
    <ResourceCrudPage<BankAccount>
      title="Contas Bancárias"
      entityLabel="Conta bancária"
      resource="bank-accounts"
      columns={columns}
      fields={fields}
      emptyDefaults={{ name: '', bankName: '', type: 'CHECKING', initialBalance: 0 }}
    />
  )
}
