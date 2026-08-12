export type DisplayStatus = 'PAGO' | 'A_PAGAR' | 'ATRASADO'

export interface FinancialEntrySummary {
  id: string
  description: string
  amount: string
  dueDate: string
  nature: 'REVENUE' | 'EXPENSE'
  displayStatus: DisplayStatus
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
