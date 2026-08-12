import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { DreRow } from '@/types/reports'

export function DreSummaryTable({ rows }: { rows: DreRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoria (ano)</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className={row.computed ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
              {row.label}
            </TableCell>
            <TableCell
              className={
                'text-right tabular-nums ' + (row.computed ? 'font-semibold text-foreground' : 'text-muted-foreground')
              }
            >
              {formatCurrency(row.total)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
