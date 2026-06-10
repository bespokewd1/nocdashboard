import { Icon } from '@iconify/react'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CriticalOfflineRow } from '@/lib/noc-data'
import { priorityMetadata } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

type CriticalDevicesTableProps = {
  rows: CriticalOfflineRow[]
  totalRows: number
  hasReport: boolean
}

const priorityClass: Record<number, string> = {
  1: 'bg-red-600 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-amber-400 text-slate-950',
  4: 'bg-blue-600 text-white',
  5: 'bg-teal-600 text-white',
}

export function CriticalDevicesTable({ rows, totalRows, hasReport }: CriticalDevicesTableProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-[var(--dashboard-panel-shadow)] ring-1 ring-slate-200/80">
      <PanelHeader title="Critical / Offline Devices" icon="tabler:alert-circle-filled" className="bg-[var(--dashboard-critical-deep)]" />
      <div className="overflow-x-auto">
        <Table className="min-w-[760px] text-xs">
          <TableHeader className="bg-slate-50 uppercase tracking-wide">
            <TableRow>
              <TableHead className="h-8">Priority</TableHead>
              <TableHead className="h-8">Type</TableHead>
              <TableHead className="h-8">Store</TableHead>
              <TableHead className="h-8">Status</TableHead>
              <TableHead className="h-8">Ticket</TableHead>
              <TableHead className="h-8">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  {hasReport ? 'No P1-P3 offline devices in view.' : 'Upload or load demo data to review offline devices.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-red-50/40">
                  <TableCell className="py-1.5">
                    <span className={cn('inline-flex min-w-10 justify-center rounded px-2 py-1 text-xs font-bold', priorityClass[row.priority])}>P{row.priority}</span>
                  </TableCell>
                  <TableCell className="py-1.5 font-medium text-slate-700">{priorityMetadata[row.priority].description}</TableCell>
                  <TableCell className="py-1.5 font-semibold text-slate-950">{row.storeId}</TableCell>
                  <TableCell className="py-1.5">
                    <span className="inline-flex items-center gap-1 font-medium text-red-600">
                      <span className="size-2 rounded-full bg-red-600" />
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5">
                    {row.ticketUrl ? <TicketLink href={row.ticketUrl} /> : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell className="max-w-56 truncate py-1.5 text-slate-500">{row.notes ?? '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TableFooter visibleRows={rows.length} totalRows={totalRows} />
    </section>
  )
}

function PanelHeader({ title, icon, className }: { title: string; icon: string; className: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white', className)}>
      <Icon icon={icon} className="size-5" />
      {title}
    </div>
  )
}

function TicketLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
      <Icon icon="tabler:ticket" className="size-4" />
      <span>Ticket</span>
    </a>
  )
}

function TableFooter({ visibleRows, totalRows }: { visibleRows: number; totalRows: number }) {
  return (
    <div className="border-t bg-slate-50 px-4 py-2 text-center text-xs font-medium text-slate-500">
      {totalRows > visibleRows ? `Showing ${visibleRows} of ${totalRows} rows - view all below` : 'Current report only'}
    </div>
  )
}

export function PriorityBadge({ priority }: { priority: number }) {
  return <Badge className={cn('gap-1 border-0', priorityClass[priority])}>P{priority}</Badge>
}
