import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Icon } from '@iconify/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  type Column,
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { AllIssuesTable } from '@/components/dashboard/AllIssuesTable'
import { CriticalDevicesTable, PriorityBadge } from '@/components/dashboard/CriticalDevicesTable'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardSidebar, type DashboardFilters } from '@/components/dashboard/DashboardSidebar'
import { DashboardTargets } from '@/components/dashboard/DashboardTargets'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { EmptyDashboardState } from '@/components/dashboard/EmptyDashboardState'
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary'
import { LteUsageTable } from '@/components/dashboard/LteUsageTable'
import type { UploadStatusView } from '@/components/dashboard/UploadStatusMenu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { dashboardIcons } from '@/lib/dashboard-icons'
import {
  type DeviceType,
  type NocImportResult,
  type NocIssue,
  type PriorityLevel,
  browserUploadReportDataSource,
  buildDashboardMetrics,
  deviceMetadata,
  deviceTypes,
  getTopCriticalOfflineRows,
  getTopLteUsageRows,
  isSupportedReportFile,
  lteHighUsageThresholdGb,
  parseNocCsvReport,
  priorityLevels,
} from '@/lib/noc-data'
import { cn } from '@/lib/utils'

type DashboardSearch = {
  priority?: string
  device?: string
  category?: string
  storeId?: string
  store?: string
}

type ReportSource = 'empty' | 'demo' | 'uploaded'

const allFilterValue = 'all'
const acceptedReportTypes = '.csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const demoReportName = 'Demo report - mock_data_for_noc_dashboard_sheet1.csv'
const demoDataAsOfLabel = 'May 19, 2025'

const emptyImportResult: NocImportResult = {
  issues: [],
  warnings: [],
  sections: [],
  stats: {
    totalRows: 0,
    dataRows: 0,
    validIssues: 0,
    invalidRows: 0,
    warningCount: 0,
  },
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    priority: readSearchString(search.priority),
    device: typeof search.device === 'string' ? search.device : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    storeId: readSearchString(search.storeId),
    store: readSearchString(search.store),
  }),
  component: NocDashboard,
})

function NocDashboard() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search = Route.useSearch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [importResult, setImportResult] = useState<NocImportResult>(emptyImportResult)
  const [reportName, setReportName] = useState('No report loaded')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [reportSource, setReportSource] = useState<ReportSource>('empty')
  const [uploadStatus, setUploadStatus] = useState<UploadStatusView>({
    kind: 'idle',
    message: 'Loading demo report...',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'priority', desc: false }])

  useEffect(() => {
    let isCancelled = false

    async function loadInitialDemo() {
      const result = await loadDemoImportResult()
      if (isCancelled) {
        return
      }
      startTransition(() => {
        setImportResult(result)
        setReportName(demoReportName)
        setReportSource('demo')
        setLastUpdated(new Date())
        setUploadStatus(buildUploadStatus(result, 'Demo report loaded'))
        setIsDemoLoading(false)
      })
    }

    void loadInitialDemo().catch(() => {
      if (isCancelled) {
        return
      }
      setImportResult(emptyImportResult)
      setReportName('No report loaded')
      setReportSource('empty')
      setUploadStatus({ kind: 'error', message: 'Demo report could not be loaded' })
      setIsDemoLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [startTransition])

  const categories = useMemo(() => Array.from(new Set(importResult.issues.map((issue) => issue.category))).sort(), [importResult.issues])
  const filters = useMemo(
    () => normalizeFilters(search, categories),
    [categories, search.category, search.device, search.priority, search.store, search.storeId],
  )
  const activeFilterCount = countActiveFilters(filters)
  const filteredIssues = useMemo(() => applyIssueFilters(importResult.issues, filters), [importResult.issues, filters])
  const metrics = useMemo(() => buildDashboardMetrics(filteredIssues), [filteredIssues])
  const table = useIssueTable(filteredIssues, sorting, setSorting)
  const hasReport = reportSource !== 'empty'
  const isUploadBusy = isProcessing || isPending || isDemoLoading
  const isFiltered = activeFilterCount > 0
  const dataAsOfLabel = reportSource === 'demo' ? demoDataAsOfLabel : hasReport ? formatDateLabel(lastUpdated) : '-'
  const dataSourceLabel = reportSource === 'demo' ? 'Demo data' : reportSource === 'uploaded' ? 'Uploaded report' : 'No report'

  function updateFilter(key: keyof DashboardSearch, value: string) {
    const nextValue = value === allFilterValue || value.trim() === '' ? undefined : value
    if (search[key] === nextValue) {
      return
    }

    void navigate({
      resetScroll: false,
      search: (current) => ({
        ...current,
        [key]: nextValue,
      }),
    })
  }

  function clearFilters() {
    void navigate({ resetScroll: false, search: {} })
  }

  async function handleLoadDemoReport() {
    setIsDemoLoading(true)
    setUploadStatus({ kind: 'processing', message: 'Loading demo report...' })
    try {
      const result = await loadDemoImportResult()
      startTransition(() => {
        setImportResult(result)
        setReportName(demoReportName)
        setReportSource('demo')
        setLastUpdated(new Date())
        setUploadStatus(buildUploadStatus(result, 'Demo report loaded'))
        setSorting([{ id: 'priority', desc: false }])
      })
      clearFilters()
    } catch {
      setUploadStatus({ kind: 'error', message: 'Demo report could not be loaded' })
    } finally {
      setIsDemoLoading(false)
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return
    }

    if (!isSupportedReportFile(file)) {
      setUploadStatus({ kind: 'error', message: 'Upload a CSV or XLSX report exported from the NOC source.' })
      return
    }

    setIsProcessing(true)
    setUploadStatus({ kind: 'processing', message: `Processing ${file.name}...` })

    try {
      const result = await browserUploadReportDataSource.importReport(file)
      startTransition(() => {
        setImportResult(result)
        setReportName(file.name)
        setReportSource('uploaded')
        setLastUpdated(new Date())
        setUploadStatus(buildUploadStatus(result, 'Report imported'))
        setSorting([{ id: 'priority', desc: false }])
      })
      clearFilters()
    } catch {
      setUploadStatus({ kind: 'error', message: 'The report could not be read. Try exporting the CSV or XLSX file again.' })
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleClearReport() {
    setImportResult(emptyImportResult)
    setReportName('No report loaded')
    setReportSource('empty')
    setLastUpdated(new Date())
    setUploadStatus({ kind: 'idle', message: 'No report loaded' })
    setSorting([{ id: 'priority', desc: false }])
    clearFilters()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <input ref={fileInputRef} className="sr-only" type="file" accept={acceptedReportTypes} onChange={(event) => void handleFile(event.target.files?.[0])} />
      <DashboardTopBar
        reportName={reportName}
        dataSourceLabel={dataSourceLabel}
        dataAsOfLabel={dataAsOfLabel}
        lastUpdatedLabel={formatTimestamp(lastUpdated)}
        uploadStatus={uploadStatus}
        warnings={importResult.warnings}
        isUploadBusy={isUploadBusy}
        hasReport={hasReport}
        onUploadClick={() => fileInputRef.current?.click()}
        onClearReport={handleClearReport}
      />

      <div className="grid w-full gap-4 p-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:p-0">
        <DashboardSidebar
          className="hidden min-h-[calc(100vh-96px)] lg:block"
          filters={filters}
          categories={categories}
          activeFilterCount={activeFilterCount}
          dataAsOfLabel={dataAsOfLabel}
          disabled={!hasReport}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
        />

        <div className="min-w-0 space-y-4 lg:p-4">
          <ExecutiveWallboard
            hasReport={hasReport}
            isFiltered={isFiltered}
            metrics={metrics}
            filters={filters}
            categories={categories}
            activeFilterCount={activeFilterCount}
            dataAsOfLabel={dataAsOfLabel}
            onFilterChange={updateFilter}
            onClearFilters={clearFilters}
          />

          {!hasReport ? (
            <EmptyDashboardState
              isLoadingDemo={isDemoLoading}
              onUploadClick={() => fileInputRef.current?.click()}
              onLoadDemo={() => void handleLoadDemoReport()}
            />
          ) : null}

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <CriticalDevicesTable rows={getTopCriticalOfflineRows(metrics)} totalRows={metrics.criticalOfflineRows.length} hasReport={hasReport} />
            <LteUsageSection metrics={metrics} hasReport={hasReport} />
          </section>

          <DashboardCharts metrics={metrics} hasReport={hasReport} />

          <AllIssuesTable
            table={table}
            filteredCount={filteredIssues.length}
            totalCount={importResult.issues.length}
            totalLteUsageLabel={metrics.totalLteUsageGb > 0 ? formatGb(metrics.totalLteUsageGb) : undefined}
            hasReport={hasReport}
            onClearFilters={clearFilters}
          />

          <DashboardTargets />
        </div>
      </div>
    </main>
  )
}

function ExecutiveWallboard({
  hasReport,
  isFiltered,
  metrics,
  filters,
  categories,
  activeFilterCount,
  dataAsOfLabel,
  onFilterChange,
  onClearFilters,
}: {
  hasReport: boolean
  isFiltered: boolean
  metrics: ReturnType<typeof buildDashboardMetrics>
  filters: DashboardFilters
  categories: string[]
  activeFilterCount: number
  dataAsOfLabel: string
  onFilterChange: (key: 'priority' | 'device' | 'category' | 'storeId', value: string) => void
  onClearFilters: () => void
}) {
  return (
    <>
      <ExecutiveSummary metrics={metrics} hasReport={hasReport} isFiltered={isFiltered} />
      <DashboardSidebar
        className="lg:hidden"
        filters={filters}
        categories={categories}
        activeFilterCount={activeFilterCount}
        dataAsOfLabel={dataAsOfLabel}
        disabled={!hasReport}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />
    </>
  )
}

function LteUsageSection({ metrics, hasReport }: { metrics: ReturnType<typeof buildDashboardMetrics>; hasReport: boolean }) {
  return <LteUsageTable rows={getTopLteUsageRows(metrics)} totalRows={metrics.lteRows.length} hasReport={hasReport} />
}

function useIssueTable(issues: NocIssue[], sorting: SortingState, setSorting: Dispatch<SetStateAction<SortingState>>) {
  const columns = useMemo<ColumnDef<NocIssue>[]>(
    () => [
      {
        accessorKey: 'storeId',
        header: ({ column }) => <SortButton column={column} label="Store" />,
        cell: ({ row }) => <span className="font-medium">{row.original.storeId}</span>,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <SortButton column={column} label="Priority" />,
        sortingFn: (rowA, rowB) => rowA.original.priority - rowB.original.priority,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <SortButton column={column} label="Category" />,
        cell: ({ row }) => <span className="block min-w-36 text-sm">{row.original.category}</span>,
      },
      {
        accessorKey: 'deviceType',
        header: ({ column }) => <SortButton column={column} label="Device/network" />,
        cell: ({ row }) => <DeviceCell deviceType={row.original.deviceType} />,
      },
      {
        accessorKey: 'dataUsageGb',
        header: ({ column }) => <SortButton column={column} label="Data usage" />,
        sortingFn: (rowA, rowB) => (rowA.original.dataUsageGb ?? -1) - (rowB.original.dataUsageGb ?? -1),
        cell: ({ row }) =>
          row.original.dataUsageGb === undefined ? (
            <span className="text-slate-400">-</span>
          ) : (
            <Badge variant={row.original.dataUsageGb >= lteHighUsageThresholdGb ? 'destructive' : 'outline'}>{formatGb(row.original.dataUsageGb)}</Badge>
          ),
      },
      {
        accessorKey: 'ticketUrl',
        enableSorting: false,
        header: 'Ticket',
        cell: ({ row }) =>
          row.original.ticketUrl ? (
            <a className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline-offset-4 hover:underline" href={row.original.ticketUrl} rel="noreferrer" target="_blank">
              <Icon icon={dashboardIcons.ticket} className="size-4" />
              Ticket
            </a>
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        accessorKey: 'notes',
        enableSorting: false,
        header: 'Notes',
        cell: ({ row }) => <span className="block max-w-80 whitespace-normal text-sm text-slate-500">{row.original.notes ?? '-'}</span>,
      },
    ],
    [],
  )

  return useReactTable({
    data: issues,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
}

function SortButton({ column, label }: { column: Column<NocIssue, unknown>; label: string }) {
  const sorted = column.getIsSorted()

  return (
    <Button type="button" variant="ghost" className="-ml-2 h-8 gap-1 px-2 text-slate-500" onClick={() => column.toggleSorting(sorted === 'asc')}>
      {label}
      <Icon icon={sorted === 'asc' ? 'tabler:chevron-up' : sorted === 'desc' ? 'tabler:chevron-down' : 'tabler:selector'} className="size-4" />
    </Button>
  )
}

function DeviceCell({ deviceType }: { deviceType: DeviceType }) {
  const metadata = deviceMetadata[deviceType]

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <Icon icon={metadata.icon} className="size-4 text-slate-500" />
      {metadata.label}
    </span>
  )
}

function normalizeFilters(search: DashboardSearch, categories: string[]): DashboardFilters {
  const priority = priorityLevels.includes(Number(search.priority) as PriorityLevel) ? String(search.priority) : allFilterValue
  const device = deviceTypes.includes(search.device as DeviceType) ? String(search.device) : allFilterValue
  const category = search.category && categories.includes(search.category) ? search.category : allFilterValue

  return {
    priority,
    device,
    category,
    store: search.storeId ?? search.store ?? '',
  }
}

function countActiveFilters(filters: DashboardFilters) {
  return [filters.priority !== allFilterValue, filters.device !== allFilterValue, filters.category !== allFilterValue, filters.store.trim() !== ''].filter(Boolean).length
}

function buildUploadStatus(result: NocImportResult, successPrefix: string): UploadStatusView {
  if (result.stats.validIssues === 0 && result.stats.warningCount > 0) {
    return { kind: 'partial', message: 'No valid issues imported; review upload warnings' }
  }
  if (result.stats.warningCount > 0) {
    return {
      kind: 'partial',
      message: `${result.stats.validIssues} valid issues imported with ${result.stats.warningCount} warning${result.stats.warningCount === 1 ? '' : 's'}`,
    }
  }
  if (result.stats.validIssues === 0) {
    return { kind: 'success', message: `${successPrefix} with no active issues found` }
  }
  return { kind: 'success', message: `${successPrefix}: ${result.stats.validIssues} valid issues` }
}

function readSearchString(value: unknown) {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

function applyIssueFilters(issues: NocIssue[], filters: DashboardFilters) {
  const storeQuery = filters.store.trim().toLowerCase()

  return issues.filter((issue) => {
    const matchesPriority = filters.priority === allFilterValue || issue.priority === Number(filters.priority)
    const matchesDevice = filters.device === allFilterValue || issue.deviceType === filters.device
    const matchesCategory = filters.category === allFilterValue || issue.category === filters.category
    const matchesStore = storeQuery === '' || issue.storeId.toLowerCase().includes(storeQuery)
    return matchesPriority && matchesDevice && matchesCategory && matchesStore
  })
}

async function loadDemoImportResult() {
  const response = await fetch('/mock_data_for_noc_dashboard_sheet1.csv')
  if (!response.ok) {
    throw new Error('Demo report fetch failed')
  }
  return parseNocCsvReport(await response.text())
}

function formatGb(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: value % 1 === 0 ? 0 : 1 }).format(value)} GB`
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
