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
  /** Força conversão para número no submit (react-hook-form valueAsNumber) mesmo em campos `select` — ex.: mês (1-12). */
  numeric?: boolean
  /** Campo só editável na criação (ex.: ano/mês que definem a identidade do registro) — fica desabilitado e é omitido do payload ao editar. */
  disabledOnEdit?: boolean
}

export interface ColumnConfig<T> {
  key: string
  label: string
  render?: (item: T) => ReactNode
}
