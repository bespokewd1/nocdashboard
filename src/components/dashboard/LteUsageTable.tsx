import { Icon } from '@iconify/react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { lteHighUsageThresholdGb, type LteUsageRow } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

type LteUsageTableProps = {
  rows: LteUsageRow[]
  totalRows: number
  hasReport: boolean
}

export function LteUsageTable({ rows, totalRows, hasReport }: LteUsageTableProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-[var(--dashboard-panel-shadow)] ring-1 ring-slate-200/80">
      <div className="flex items-center gap-2 bg-[var(--dashboard-gold)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
        <Icon icon="tabler:cell-signal-5" className="size-5" />
        LTE Usage Overview - Threshold {lteHighUsageThresholdGb}GB
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[720px] text-xs">
          <TableHeader className="bg-slate-50 uppercase tracking-wide">
            <TableRow>
              <TableHead className="h-8">Store</TableHead>
              <TableHead className="h-8">Data usage</TableHead>
              <TableHead className="h-8">Usage %</TableHead>
              <TableHead className="h-8">Status</TableHead>
              <TableHead className="h-8">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  {hasReport ? 'No LTE rows in view.' : 'Upload or load demo data to review LTE usage.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-amber-50/40">
                  <TableCell className="py-1.5 font-semibold text-slate-950">{row.storeId}</TableCell>
                  <TableCell className="py-1.5 font-medium text-slate-700">{row.dataUsageGb === undefined ? '-' : formatGb(row.dataUsageGb)}</TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex min-w-36 items-center gap-2">
                      <Progress value={Math.min(100, row.usagePercent ?? 0)} className="h-3" />
                      <span className="w-10 text-right text-slate-600">{row.usagePercent === undefined ? '-' : `${row.usagePercent}%`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5"><LteStatusBadge status={row.status} /></TableCell>
                  <TableCell className="py-1.5 text-slate-600">{row.action}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t bg-slate-50 px-4 py-2 text-center text-xs font-medium text-slate-500">
        {totalRows > rows.length ? `Showing ${rows.length} of ${totalRows} LTE rows - view all below` : 'Current report only'}
      </div>
    </section>
  )
}

function LteStatusBadge({ status }: { status: LteUsageRow['status'] }) {
  return (
    <Badge
      className={cn(
        'border-0',
        status === 'High' && 'bg-red-100 text-red-700 hover:bg-red-100',
        status === 'Monitor' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
        status === 'Unknown' && 'bg-slate-100 text-slate-600 hover:bg-slate-100',
      )}
    >
      {status}
    </Badge>
  )
}

function formatGb(value: number) {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} GB`
}
