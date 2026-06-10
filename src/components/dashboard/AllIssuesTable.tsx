import { Icon } from '@iconify/react'
import { flexRender, type Table as ReactTable } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NocIssue } from '@/lib/noc-data'

type AllIssuesTableProps = {
  table: ReactTable<NocIssue>
  filteredCount: number
  totalCount: number
  totalLteUsageLabel?: string
  hasReport: boolean
  onClearFilters: () => void
}

export function AllIssuesTable({
  table,
  filteredCount,
  totalCount,
  totalLteUsageLabel,
  hasReport,
  onClearFilters,
}: AllIssuesTableProps) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-[var(--dashboard-panel-shadow)] ring-1 ring-slate-200/80">
      <div className="flex flex-col gap-3 border-b bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-slate-900">
            <Icon icon="tabler:table" className="size-5" />
            All Issues
          </h2>
          <p className="text-sm text-slate-500">
            {hasReport ? `Showing ${filteredCount} of ${totalCount} issues` : 'Upload or load demo data to populate the issue list'}
            {hasReport && totalLteUsageLabel ? ` - ${totalLteUsageLabel} LTE in view` : ''}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onClearFilters}>
          <Icon icon="tabler:filter-x" className="size-4" />
          Clear filters
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[920px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-slate-500">
                    {hasReport ? 'No issues match the current filters.' : 'Upload a CSV or XLSX report to populate this table.'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
