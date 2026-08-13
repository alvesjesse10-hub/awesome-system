export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  document: string | null
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  document: string | null
}

export type CommissionType = 'PERCENTAGE' | 'FIXED'

export interface Employee {
  id: string
  name: string
  email: string | null
  phone: string | null
  document: string | null
  pixKey: string | null
  role: string
  baseSalary: string | null
  commissionType: CommissionType
  commissionValue: string | null
  isActive: boolean
}

export interface CostCenter {
  id: string
  name: string
  isActive: boolean
}

export type BankAccountType = 'CHECKING' | 'INVESTMENT'

export interface BankAccount {
  id: string
  name: string
  type: BankAccountType
  bankName: string | null
  initialBalance: string
  isActive: boolean
}
