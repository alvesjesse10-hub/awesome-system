import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { StatTile } from '@/components/dashboard/stat-tile'
import { CountBarList } from '@/components/dashboard/count-bar-list'
import { useAccountsPayable } from '@/hooks/use-reports'
import { formatCurrency } from '@/lib/utils'

export function AccountsPayableDashboardPage() {
  const [nature, setNature] = useState<'EXPENSE' | 'REVENUE'>('EXPENSE')
  const { data, isLoading } = useAccountsPayable(nature)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {nature === 'EXPENSE' ? 'Contas a Pagar' : 'Contas a Receber'}
          </h1>
          <p className="text-sm text-muted-foreground">Vencimentos em aberto por prazo, fornecedor e centro de custo</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="nature-filter" className="text-muted-foreground">
            Visão
          </Label>
          <Select id="nature-filter" className="w-44" value={nature} onChange={(e) => setNature(e.target.value as typeof nature)}>
            <option value="EXPENSE">Contas a pagar</option>
            <option value="REVENUE">Contas a receber</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile
          label="Total em aberto"
          value={isLoading ? '…' : formatCurrency(data?.totalOpen.total ?? 0)}
          sublabel={data ? `${data.totalOpen.count} conta(s)` : undefined}
        />
        <StatTile
          label="Atrasadas"
          value={isLoading ? '…' : formatCurrency(data?.overdue.total ?? 0)}
          sublabel={data ? `${data.overdue.count} conta(s)` : undefined}
          tone={data?.overdue.count ? 'critical' : 'default'}
        />
        <StatTile
          label="Vencendo hoje"
          value={isLoading ? '…' : formatCurrency(data?.dueToday.total ?? 0)}
          sublabel={data ? `${data.dueToday.count} conta(s)` : undefined}
        />
        <StatTile
          label="Vencendo esta semana"
          value={isLoading ? '…' : formatCurrency(data?.dueThisWeek.total ?? 0)}
          sublabel={data ? `${data.dueThisWeek.count} conta(s)` : undefined}
        />
        <StatTile
          label="Vencendo este mês"
          value={isLoading ? '…' : formatCurrency(data?.dueThisMonth.total ?? 0)}
          sublabel={data ? `${data.dueThisMonth.count} conta(s)` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por centro de custo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data || data.byCostCenter.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada em aberto.</p>
            ) : (
              <CountBarList
                items={data.byCostCenter.map((row) => ({ label: row.name, count: row.total }))}
                formatValue={formatCurrency}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{nature === 'EXPENSE' ? 'Por fornecedor' : 'Por cliente'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : !data || data.byParty.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada em aberto.</p>
            ) : (
              <CountBarList
                items={data.byParty.map((row) => ({ label: row.name, count: row.total }))}
                formatValue={formatCurrency}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
