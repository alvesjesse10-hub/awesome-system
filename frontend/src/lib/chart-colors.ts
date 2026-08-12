// Paleta categórica validada (dataviz skill): ordem fixa, nunca ciclada
// arbitrariamente. Slots 3/4/5 (aqua/amarelo/magenta) têm contraste sub-3:1
// no fundo claro — sempre usados com legenda/rótulo direto, nunca sozinhos.
export const CHART_COLORS = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  magenta: '#e87ba4',
  green: '#008300',
  violet: '#4a3aa7',
  red: '#e34948',
} as const

export const CATEGORICAL_SEQUENCE = [
  CHART_COLORS.blue,
  CHART_COLORS.orange,
  CHART_COLORS.aqua,
  CHART_COLORS.yellow,
  CHART_COLORS.magenta,
  CHART_COLORS.green,
  CHART_COLORS.violet,
  CHART_COLORS.red,
]

// Status reservados — nunca reaproveitados como série categórica.
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
}

export const CHART_INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
}
