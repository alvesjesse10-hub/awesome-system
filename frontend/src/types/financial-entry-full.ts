import type { DisplayStatus, PaginatedResult } from './financial-entry'

export interface FinancialEntry {
  id: string
  clientId: string | null
  supplierId: string | null
  costCenterId: string
  chartOfAccountId: string
  bankAccountId: string | null
  jobId: string | null
  nature: 'REVENUE' | 'EXPENSE'
  invoiceNumber: string | null
  description: string
  amount: string
  installmentGroupId: string | null
  installmentNumber: number
  installmentTotal: number
  entryDate: string
  dueDate: string
  paymentDate: string | null
  status: 'PENDING' | 'PAID'
  situacao: string | null
  client: { id: string; name: string } | null
  supplier: { id: string; name: string } | null
  costCenter: { id: string; name: string }
  chartOfAccount: { id: string; name: string; group: string }
  bankAccount: { id: string; name: string } | null
  job: { id: string; name: string } | null
  displayStatus: DisplayStatus
}

export type FinancialEntryList = PaginatedResult<FinancialEntry>
