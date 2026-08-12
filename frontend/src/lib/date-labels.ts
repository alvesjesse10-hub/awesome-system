export const MONTH_LABELS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function currentYear() {
  return new Date().getFullYear()
}

export function currentMonth() {
  return new Date().getMonth() + 1
}
