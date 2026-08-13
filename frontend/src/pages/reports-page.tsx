import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatTile } from '@/components/dashboard/stat-tile'
import { CountBarList } from '@/components/dashboard/count-bar-list'
import { MonthlyBreakdownTable, type MonthlyRow } from '@/components/dashboard/monthly-breakdown-table'
import { ExportMenu } from '@/components/dashboard/export-menu'
import { useAuth } from '@/context/auth-context'
import {
  useScopedAccountsPayable,
  useScopedBankBalances,
  useScopedCashFlow,
  useScopedClientsReport,
  useScopedCommissionRanking,
  useScopedDre,
  useScopedJobProfitability,
  useScopedSuppliersReport,
} from '@/hooks/use-scoped-reports'
import { MONTH_LABELS_FULL, MONTH_LABELS_SHORT, currentYear } from '@/lib/date-labels'
import { formatCurrency } from '@/lib/utils'

const CONSOLIDATED_VALUE = '__consolidated__'

type ReportKey =
  | 'dre'
  | 'cash-flow'
  | 'bank-balances'
  | 'job-profitability'
  | 'clients'
  | 'suppliers'
  | 'accounts-payable'
  | 'commission-ranking'

const REPORTS: { key: ReportKey; label: string; needsYear: boolean; needsMonth: boolean; needsNature: boolean }[] = [
  { key: 'dre', label: 'DRE', needsYear: true, needsMonth: false, needsNature: false },
  { key: 'cash-flow', label: 'Fluxo de Caixa', needsYear: true, needsMonth: false, needsNature: false },
  { key: 'bank-balances', label: 'Saldo Bancário', needsYear: false, needsMonth: false, needsNature: false },
  { key: 'job-profitability', label: 'Rentabilidade por Job', needsYear: true, needsMonth: true, needsNature: false },
  { key: 'clients', label: 'Clientes', needsYear: true, needsMonth: false, needsNature: false },
  { key: 'suppliers', label: 'Fornecedores', needsYear: true, needsMonth: false, needsNature: false },
  { key: 'accounts-payable', label: 'Contas a Pagar/Receber', needsYear: false, needsMonth: false, needsNature: true },
  { key: 'commission-ranking', label: 'Ranking de Comissões', needsYear: true, needsMonth: true, needsNature: false },
]

const monthOptions = MONTH_LABELS_FULL.map((label, index) => ({ value: String(index + 1), label }))

export function ReportsPage() {
  const { user, activeCompany } = useAuth()
  const [reportKey, setReportKey] = useState<ReportKey>('dre')
  const [scopeValue, setScopeValue] = useState<string>(activeCompany?.id ?? CONSOLIDATED_VALUE)
  const [year, setYear] = useState(currentYear())
  const [month, setMonth] = useState<number | undefined>(undefined)
  const [nature, setNature] = useState<'EXPENSE' | 'REVENUE'>('EXPENSE')

  const scopeId = scopeValue === CONSOLIDATED_VALUE ? null : scopeValue
  const scopeHeaders = { 'X-Company-Id': scopeId ?? '' }
  const meta = REPORTS.find((r) => r.key === reportKey)!

  const dre = useScopedDre(scopeId, year, reportKey === 'dre')
  const cashFlow = useScopedCashFlow(scopeId, year, reportKey === 'cash-flow')
  const bankBalances = useScopedBankBalances(scopeId, reportKey === 'bank-balances')
  const jobProfitability = useScopedJobProfitability(scopeId, year, month, reportKey === 'job-profitability')
  const clients = useScopedClientsReport(scopeId, year, reportKey === 'clients')
  const suppliers = useScopedSuppliersReport(scopeId, year, reportKey === 'suppliers')
  const accountsPayable = useScopedAccountsPayable(scopeId, nature, reportKey === 'accounts-payable')
  const commissionRanking = useScopedCommissionRanking(scopeId, year, month, reportKey === 'commission-ranking')

  const dreRows: MonthlyRow[] = useMemo(
    () => (dre.data?.rows ?? []).map((row) => ({ key: row.key, label: row.label, months: row.months, total: row.total, emphasize: row.computed })),
    [dre.data],
  )
  const clientRows: MonthlyRow[] = useMemo(
    () => (clients.data ?? []).map((row) => ({ key: row.id, label: row.name, months: row.months, total: row.total })),
    [clients.data],
  )
  const supplierRows: MonthlyRow[] = useMemo(
    () => (suppliers.data ?? []).map((row) => ({ key: row.id, label: row.name, months: row.months, total: row.total })),
    [suppliers.data],
  )

  const exportParams: Record<string, string | number | undefined> = {
    ...(meta.needsYear ? { year } : {}),
    ...(meta.needsMonth ? { month } : {}),
    ...(meta.needsNature ? { nature } : {}),
  }
  const isLoading =
    dre.isLoading ||
    cashFlow.isLoading ||
    bankBalances.isLoading ||
    jobProfitability.isLoading ||
    clients.isLoading ||
    suppliers.isLoading ||
    accountsPayable.isLoading ||
    commissionRanking.isLoading

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Todos os relatórios do sistema, com exportação em CSV, Excel e PDF</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((report) => (
          <Button
            key={report.key}
            type="button"
            variant={reportKey === report.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportKey(report.key)}
          >
            {report.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-scope" className="text-muted-foreground">
              Visão
            </Label>
            <Select id="report-scope" className="w-56" value={scopeValue} onChange={(e) => setScopeValue(e.target.value)}>
              <option value={CONSOLIDATED_VALUE}>🌐 Consolidado (grupo)</option>
              {user?.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName ?? company.name}
                </option>
              ))}
            </Select>
          </div>

          {meta.needsYear && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-year" className="text-muted-foreground">
                Ano
              </Label>
              <Input
                id="report-year"
                type="number"
                className="w-28"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || currentYear())}
              />
            </div>
          )}

          {meta.needsMonth && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-month" className="text-muted-foreground">
                Mês
              </Label>
              <Select
                id="report-month"
                className="w-40"
                value={month ?? ''}
                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Todos os meses</option>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {meta.needsNature && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-nature" className="text-muted-foreground">
                Natureza
              </Label>
              <Select id="report-nature" className="w-44" value={nature} onChange={(e) => setNature(e.target.value as typeof nature)}>
                <option value="EXPENSE">Contas a pagar</option>
                <option value="REVENUE">Contas a receber</option>
              </Select>
            </div>
          )}

          <div className="ml-auto">
            <ExportMenu path={`/reports/${reportKey}`} params={exportParams} filenameBase={reportKey} headers={scopeHeaders} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{meta.label}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              {reportKey === 'dre' && <MonthlyBreakdownTable rows={dreRows} labelHeader="Categoria" />}

              {reportKey === 'cash-flow' && cashFlow.data && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatTile label="Saldo de abertura" value={formatCurrency(cashFlow.data.openingBalance)} />
                    <StatTile label="Saldo atual" value={formatCurrency(cashFlow.data.currentBalance)} />
                    <StatTile
                      label="Projeção 90 dias"
                      value={formatCurrency(cashFlow.data.projection.find((p) => p.horizonDays === 90)?.projectedBalance ?? 0)}
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlow.data.months.map((m) => (
                        <TableRow key={m.month}>
                          <TableCell>{MONTH_LABELS_SHORT[m.month - 1]}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(m.entries)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(m.exits)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{formatCurrency(m.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {reportKey === 'bank-balances' &&
                (!bankBalances.data || bankBalances.data.accounts.length === 0 ? (
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
                ))}

              {reportKey === 'job-profitability' &&
                (!jobProfitability.data || jobProfitability.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum job no período selecionado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Custos Diretos</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="text-right">Margem %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobProfitability.data.map((row) => (
                        <TableRow key={row.jobId}>
                          <TableCell>{row.jobName}</TableCell>
                          <TableCell className="text-muted-foreground">{row.clientName ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(row.directCosts)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(row.commission)}</TableCell>
                          <TableCell
                            className={'text-right font-medium tabular-nums ' + (row.margin >= 0 ? 'text-success' : 'text-destructive')}
                          >
                            {formatCurrency(row.margin)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.marginPercent.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ))}

              {reportKey === 'clients' && <MonthlyBreakdownTable rows={clientRows} labelHeader="Cliente" />}
              {reportKey === 'suppliers' && <MonthlyBreakdownTable rows={supplierRows} labelHeader="Fornecedor" />}

              {reportKey === 'accounts-payable' && accountsPayable.data && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatTile
                      label="Total em aberto"
                      value={formatCurrency(accountsPayable.data.totalOpen.total)}
                      sublabel={`${accountsPayable.data.totalOpen.count} conta(s)`}
                    />
                    <StatTile
                      label="Atrasadas"
                      value={formatCurrency(accountsPayable.data.overdue.total)}
                      sublabel={`${accountsPayable.data.overdue.count} conta(s)`}
                      tone={accountsPayable.data.overdue.count ? 'critical' : 'default'}
                    />
                    <StatTile
                      label="Vencendo hoje"
                      value={formatCurrency(accountsPayable.data.dueToday.total)}
                      sublabel={`${accountsPayable.data.dueToday.count} conta(s)`}
                    />
                    <StatTile
                      label="Vencendo esta semana"
                      value={formatCurrency(accountsPayable.data.dueThisWeek.total)}
                      sublabel={`${accountsPayable.data.dueThisWeek.count} conta(s)`}
                    />
                    <StatTile
                      label="Vencendo este mês"
                      value={formatCurrency(accountsPayable.data.dueThisMonth.total)}
                      sublabel={`${accountsPayable.data.dueThisMonth.count} conta(s)`}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">Por centro de custo</h3>
                      {accountsPayable.data.byCostCenter.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nada em aberto.</p>
                      ) : (
                        <CountBarList
                          items={accountsPayable.data.byCostCenter.map((row) => ({ label: row.name, count: row.total }))}
                          formatValue={formatCurrency}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-foreground">
                        {nature === 'EXPENSE' ? 'Por fornecedor' : 'Por cliente'}
                      </h3>
                      {accountsPayable.data.byParty.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nada em aberto.</p>
                      ) : (
                        <CountBarList
                          items={accountsPayable.data.byParty.map((row) => ({ label: row.name, count: row.total }))}
                          formatValue={formatCurrency}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {reportKey === 'commission-ranking' &&
                (!commissionRanking.data || commissionRanking.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma comissão no período selecionado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="text-right">Jobs</TableHead>
                        <TableHead className="text-right">Success</TableHead>
                        <TableHead className="text-right">Comissão Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRanking.data.map((row) => (
                        <TableRow key={row.employeeId}>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.jobsCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.successCount}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{formatCurrency(row.totalCommission)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
