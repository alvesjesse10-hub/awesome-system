import type { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'textarea'
  required?: boolean
  options?: SelectOption[]
  step?: string
  placeholder?: string
}

export interface ColumnConfig<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
}
