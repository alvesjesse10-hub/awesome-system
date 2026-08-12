import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { StatTile } from '@/components/dashboard/stat-tile'
import { RevenueExpenseChart } from '@/components/dashboard/revenue-expense-chart'
import { DreSummaryTable } from '@/components/dashboard/dre-summary-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/auth-context'
import { useScopedBankBalances, useScopedCashFlow, useScopedDre } from '@/hooks/use-scoped-reports'
import { formatCurrency } from '@/lib/utils'
import { currentYear } from '@/lib/date-labels'

const CONSOLIDATED_VALUE = '__consolidated__'
const COST_EXPENSE_KEYS = ['CUSTO_FIXO', 'DESPESA_FIXA', 'CUSTO_VARIAVEL', 'DESPESA_VARIAVEL']

export function FinancialDashboardPage() {
  const { user, activeCompany } = useAuth()
  const [scopeValue, setScopeValue] = useState<string>(activeCompany?.id ?? CONSOLIDATED_VALUE)
  const scopeId = scopeValue === CONSOLIDATED_VALUE ? null : scopeValue
  const year = currentYear()

  const dre = useScopedDre(scopeId, year)
  const cashFlow = useScopedCashFlow(scopeId, year)
  const bankBalances = useScopedBankBalances(scopeId)

  const revenueRow = dre.data?.rows.find((row) => row.key === 'RECEITA')
  const resultRow = dre.data?.rows.find((row) => row.key === 'RESULTADO_FINAL')
  const expensesByMonth = dre.data
    ? dre.data.rows
        .filter((row) => COST_EXPENSE_KEYS.includes(row.key))
        .reduce((totals, row) => row.months.map((value, i) => totals[i] + value), new Array(12).fill(0))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão por empresa ou consolidada do grupo</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="scope-select" className="text-muted-foreground">
            Visão
          </Label>
          <Select id="scope-select" className="w-56" value={scopeValue} onChange={(e) => setScopeValue(e.target.value)}>
            <option value={CONSOLIDATED_VALUE}>🌐 Consolidado (grupo)</option>
            {user?.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.tradeName ?? company.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Receita realizada (ano)"
          value={dre.isLoading ? '…' : formatCurrency(revenueRow?.total ?? 0)}
        />
        <StatTile
          label="Resultado final (ano)"
          value={dre.isLoading ? '…' : formatCurrency(resultRow?.total ?? 0)}
          tone={resultRow && resultRow.total >= 0 ? 'good' : 'critical'}
        />
        <StatTile
          label="Saldo em caixa"
          value={bankBalances.isLoading ? '…' : formatCurrency(bankBalances.data?.consolidatedBalance ?? 0)}
        />
        <StatTile
          label="Projeção de saldo (90 dias)"
          value={cashFlow.isLoading ? '…' : formatCurrency(cashFlow.data?.projection[2]?.projectedBalance ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receitas x Despesas — {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {dre.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <RevenueExpenseChart revenue={revenueRow?.months ?? []} expenses={expensesByMonth} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DRE resumido — {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {dre.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <DreSummaryTable rows={dre.data?.rows ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo por conta bancária</CardTitle>
        </CardHeader>
        <CardContent>
          {bankBalances.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !bankBalances.data || bankBalances.data.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta bancária cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Saldo atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankBalances.data.accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="text-muted-foreground">{account.companyName}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(account.totalIn)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(account.totalOut)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-foreground">
                      {formatCurrency(account.currentBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
