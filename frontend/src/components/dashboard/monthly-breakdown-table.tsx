import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MONTH_LABELS_SHORT } from '@/lib/date-labels'
import { formatCurrency } from '@/lib/utils'

export interface MonthlyRow {
  key: string
  label: string
  months: number[]
  total: number
  emphasize?: boolean
}

/** Grade categoria/nome x 12 meses x total — usada por DRE, Clientes e Fornecedores. Rola horizontalmente em telas estreitas. */
export function MonthlyBreakdownTable({ rows, labelHeader }: { rows: MonthlyRow[]; labelHeader: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum dado para o período selecionado.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 min-w-40 bg-card">{labelHeader}</TableHead>
            {MONTH_LABELS_SHORT.map((month) => (
              <TableHead key={month} className="text-right">
                {month}
              </TableHead>
            ))}
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell
                className={
                  'sticky left-0 min-w-40 bg-card whitespace-nowrap ' +
                  (row.emphasize ? 'font-semibold text-foreground' : 'text-muted-foreground')
                }
              >
                {row.label}
              </TableCell>
              {row.months.map((value, i) => (
                <TableCell
                  key={i}
                  className={'text-right tabular-nums ' + (row.emphasize ? 'font-semibold text-foreground' : '')}
                >
                  {formatCurrency(value)}
                </TableCell>
              ))}
              <TableCell className={'text-right tabular-nums ' + (row.emphasize ? 'font-semibold text-foreground' : 'font-medium')}>
                {formatCurrency(row.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
