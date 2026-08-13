export interface DreRow {
  key: string
  label: string
  months: number[]
  total: number
  computed: boolean
}

export interface DreReport {
  year: number
  companyIds: string[]
  rows: DreRow[]
}

export interface CashFlowMonth {
  month: number
  entries: number
  exits: number
  balance: number
}

export interface CashFlowProjection {
  horizonDays: number
  projectedBalance: number
}

export interface CashFlowReport {
  year: number
  companyIds: string[]
  openingBalance: number
  months: CashFlowMonth[]
  currentBalance: number
  projection: CashFlowProjection[]
}

export interface BankBalanceAccount {
  id: string
  name: string
  companyId: string
  companyName: string
  type: 'CHECKING' | 'INVESTMENT'
  initialBalance: number
  totalIn: number
  totalOut: number
  currentBalance: number
}

export interface BankBalancesReport {
  accounts: BankBalanceAccount[]
  consolidatedBalance: number
}

export interface AccountsPayableSummary {
  nature: 'REVENUE' | 'EXPENSE'
  totalOpen: { count: number; total: number }
  overdue: { count: number; total: number }
  dueToday: { count: number; total: number }
  dueThisWeek: { count: number; total: number }
  dueThisMonth: { count: number; total: number }
  byCostCenter: { costCenterId: string; name: string; total: number }[]
  byParty: { id: string; name: string; total: number }[]
}

export interface JobProfitabilityRow {
  jobId: string
  jobName: string
  clientName: string | null
  revenue: number
  directCosts: number
  commission: number
  margin: number
  marginPercent: number
}

export interface PartyReportRow {
  id: string
  name: string
  months: number[]
  total: number
}

export interface CommissionRankingRow {
  employeeId: string
  employeeName: string
  jobsCount: number
  successCount: number
  totalCommission: number
}

export interface RevenueGoalComparisonRow {
  month: number
  target: number
  realized: number
  achievementPercent: number | null
}

export interface RevenueProjectionComparisonRow {
  month: number
  projected: number
  realized: number
}
