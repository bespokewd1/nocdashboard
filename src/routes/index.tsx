import { type Dispatch, type SetStateAction, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import mockCsvReport from '../../mock_data_for_noc_dashboard_sheet1.csv?raw'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { dashboardIcons } from '@/lib/dashboard-icons'
import {
  type DeviceType,
  type NocImportResult,
  type NocIssue,
  type PriorityLevel,
  deviceMetadata,
  deviceTypes,
  parseNocCsvReport,
  priorityLevels,
  priorityMetadata,
} from '@/lib/noc-data'

type DashboardSearch = {
  priority?: string
  device?: string
  category?: string
  storeId?: string
  store?: string
}

type KpiCard = {
  label: string
  value: string
  detail: string
  icon: string
  intent: 'neutral' | 'critical' | 'watch' | 'good'
}

const allFilterValue = 'all'
const highUsageThresholdGb = 75

const priorityChartColors: Record<PriorityLevel, string> = {
  1: '#dc2626',
  2: '#d97706',
  3: '#ea580c',
  4: '#2563eb',
  5: '#64748b',
}

const deviceChartColors: Record<DeviceType, string> = {
  PBX: '#334155',
  InHand: '#0f766e',
  Cradlepoint: '#7c3aed',
  LTE: '#2563eb',
  Unknown: '#94a3b8',
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
  const [importResult, setImportResult] = useState<NocImportResult>(() =>
    parseNocCsvReport(mockCsvReport),
  )
  const [reportName, setReportName] = useState('mock_data_for_noc_dashboard_sheet1.csv')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [uploadError, setUploadError] = useState<string>()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'priority', desc: false },
  ])

  const categories = useMemo(
    () => Array.from(new Set(importResult.issues.map((issue) => issue.category))).sort(),
    [importResult.issues],
  )
  const filters = useMemo(
    () => normalizeFilters(search, categories),
    [
      categories,
      search.category,
      search.device,
      search.priority,
      search.store,
      search.storeId,
    ],
  )
  const filteredIssues = useMemo(
    () => applyIssueFilters(importResult.issues, filters),
    [importResult.issues, filters],
  )
  const metrics = useMemo(() => buildDashboardMetrics(importResult.issues), [importResult.issues])
  const filteredMetrics = useMemo(() => buildDashboardMetrics(filteredIssues), [filteredIssues])
  const table = useIssueTable(filteredIssues, sorting, setSorting)

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

  async function handleFile(file: File | undefined) {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Upload a CSV report for this MVP build.')
      return
    }

    try {
      const text = await file.text()
      setImportResult(parseNocCsvReport(text))
      setReportName(file.name)
      setLastUpdated(new Date())
      setUploadError(undefined)
    } catch {
      setUploadError('The report could not be read. Try exporting the CSV again.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon icon={dashboardIcons.router} className="size-4 shrink-0" />
              QSR Network Operations
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">NOC Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reportName} • Updated {formatTimestamp(lastUpdated)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Icon icon={dashboardIcons.upload} className="size-4" />
              Upload CSV
            </Button>
            <Badge variant={uploadError ? 'destructive' : 'secondary'} className="justify-center">
              {uploadError ?? `${importResult.stats.validIssues} valid issues imported`}
            </Badge>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {buildKpiCards(metrics).map((card) => (
            <KpiCardView key={card.label} card={card} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon={dashboardIcons.charts} className="size-5" />
                Priority Overview
              </CardTitle>
              <CardDescription>Issue volume by operational priority</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
              <div className="h-56 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.priorityRows} margin={{ left: -18, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.14)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {metrics.priorityRows.map((row) => (
                        <Cell key={row.priority} fill={priorityChartColors[row.priority]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {metrics.priorityRows.map((row) => (
                  <SummaryRow
                    key={row.priority}
                    icon={priorityMetadata[row.priority].icon}
                    label={priorityMetadata[row.priority].label}
                    detail={priorityMetadata[row.priority].description}
                    value={row.count}
                    color={priorityChartColors[row.priority]}
                    max={metrics.totalIssues}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon={dashboardIcons.signal} className="size-5" />
                Device and Network
              </CardTitle>
              <CardDescription>Concentration by device or backup state</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[0.8fr_1fr] lg:grid-cols-1 xl:grid-cols-[0.78fr_1fr]">
              <div className="h-48 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.deviceRows.filter((row) => row.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {metrics.deviceRows
                        .filter((row) => row.count > 0)
                        .map((row) => (
                          <Cell key={row.deviceType} fill={deviceChartColors[row.deviceType]} />
                        ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {metrics.deviceRows.map((row) => (
                  <SummaryRow
                    key={row.deviceType}
                    icon={deviceMetadata[row.deviceType].icon}
                    label={deviceMetadata[row.deviceType].label}
                    detail={`${row.count} issue${row.count === 1 ? '' : 's'}`}
                    value={row.count}
                    color={deviceChartColors[row.deviceType]}
                    max={metrics.totalIssues}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon={dashboardIcons.lte} className="size-5" />
                LTE Usage
              </CardTitle>
              <CardDescription>
                Stores on LTE backup with high usage highlighted at {highUsageThresholdGb} GB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.lteRows.length === 0 ? (
                <EmptyPanel message="No LTE backup rows found in the current report." />
              ) : (
                metrics.lteRows.map((row) => (
                  <div key={row.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">Store {row.storeId}</span>
                      <Badge variant={row.highUsage ? 'destructive' : 'outline'}>
                        {formatGb(row.dataUsageGb)}
                      </Badge>
                    </div>
                    <Progress value={Math.min(100, (row.dataUsageGb / 120) * 100)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon icon="tabler:clipboard-check" className="size-5" />
                Upload Result
              </CardTitle>
              <CardDescription>
                {importResult.stats.totalRows} rows processed, {importResult.stats.warningCount}{' '}
                warning{importResult.stats.warningCount === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <StatPill label="Data rows" value={importResult.stats.dataRows} />
                <StatPill label="Valid issues" value={importResult.stats.validIssues} />
                <StatPill label="Invalid rows" value={importResult.stats.invalidRows} />
              </div>
              <div className="max-h-36 overflow-auto rounded-md border">
                {importResult.warnings.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No upload warnings for this report.
                  </div>
                ) : (
                  importResult.warnings.slice(0, 8).map((warning, index) => (
                    <div
                      key={`${warning.code}-${warning.rowNumber ?? index}`}
                      className="border-b px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="font-medium">{warning.code}</span>
                      {warning.rowNumber ? (
                        <span className="text-muted-foreground"> • row {warning.rowNumber}</span>
                      ) : null}
                      <p className="mt-0.5 text-muted-foreground">{warning.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="gap-3 pb-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon icon={dashboardIcons.table} className="size-5" />
                  Issue List
                </CardTitle>
                <CardDescription>
                  Showing {filteredIssues.length} of {importResult.issues.length} issues
                  {filteredMetrics.totalLteUsageGb > 0
                    ? ` • ${formatGb(filteredMetrics.totalLteUsageGb)} LTE in view`
                    : ''}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                  void navigate({
                    resetScroll: false,
                    search: {},
                  })
                }
              >
                <Icon icon="tabler:filter-x" className="size-4" />
                Clear filters
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-[1.1fr_0.7fr_0.9fr_1fr]">
              <Input
                value={filters.store}
                onChange={(event) => updateFilter('storeId', event.target.value)}
                placeholder="Search store"
              />
              <Select
                value={filters.priority}
                onValueChange={(value) => updateFilter('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allFilterValue}>All priorities</SelectItem>
                  {priorityLevels.map((priority) => (
                    <SelectItem key={priority} value={String(priority)}>
                      {priorityMetadata[priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.device} onValueChange={(value) => updateFilter('device', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allFilterValue}>All devices</SelectItem>
                  {deviceTypes.map((deviceType) => (
                    <SelectItem key={deviceType} value={deviceType}>
                      {deviceMetadata[deviceType].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.category}
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allFilterValue}>All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyPanel message="No issues match the current filters." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function useIssueTable(
  issues: NocIssue[],
  sorting: SortingState,
  setSorting: Dispatch<SetStateAction<SortingState>>,
) {
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
        cell: ({ row }) => (
          <span className="block min-w-36 text-sm">{row.original.category}</span>
        ),
      },
      {
        accessorKey: 'deviceType',
        header: ({ column }) => <SortButton column={column} label="Device/network" />,
        cell: ({ row }) => <DeviceCell deviceType={row.original.deviceType} />,
      },
      {
        accessorKey: 'dataUsageGb',
        header: ({ column }) => <SortButton column={column} label="Data usage" />,
        sortingFn: (rowA, rowB) =>
          (rowA.original.dataUsageGb ?? -1) - (rowB.original.dataUsageGb ?? -1),
        cell: ({ row }) =>
          row.original.dataUsageGb === undefined ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <Badge
              variant={
                row.original.dataUsageGb >= highUsageThresholdGb ? 'destructive' : 'outline'
              }
            >
              {formatGb(row.original.dataUsageGb)}
            </Badge>
          ),
      },
      {
        accessorKey: 'ticketUrl',
        enableSorting: false,
        header: 'Ticket',
        cell: ({ row }) =>
          row.original.ticketUrl ? (
            <a
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={row.original.ticketUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Icon icon={dashboardIcons.ticket} className="size-4" />
              Ticket
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: 'notes',
        enableSorting: false,
        header: 'Notes',
        cell: ({ row }) => (
          <span className="block max-w-80 whitespace-normal text-sm text-muted-foreground">
            {row.original.notes ?? '-'}
          </span>
        ),
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

function SortButton({
  column,
  label,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  label: string
}) {
  const sorted = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-2 h-8 gap-1 px-2 text-muted-foreground"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      <Icon
        icon={sorted === 'asc' ? 'tabler:chevron-up' : sorted === 'desc' ? 'tabler:chevron-down' : 'tabler:selector'}
        className="size-4"
      />
    </Button>
  )
}

function KpiCardView({ card }: { card: KpiCard }) {
  return (
    <Card className={cn('overflow-hidden', kpiCardClass(card.intent))}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{card.label}</CardDescription>
          <Icon icon={card.icon} className="size-5 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">{card.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{card.detail}</p>
      </CardContent>
    </Card>
  )
}

function SummaryRow({
  icon,
  label,
  detail,
  value,
  color,
  max,
}: {
  icon: string
  label: string
  detail: string
  value: number
  color: string
  max: number
}) {
  const percent = max === 0 ? 0 : (value / max) * 100

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon icon={icon} className="size-4 shrink-0" style={{ color }} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{label}</div>
            <div className="truncate text-xs text-muted-foreground">{detail}</div>
          </div>
        </div>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const metadata = priorityMetadata[priority]

  return (
    <Badge variant={priority === 1 ? 'destructive' : 'secondary'} className="gap-1">
      <Icon icon={metadata.icon} className="size-3.5" />
      {metadata.label}
    </Badge>
  )
}

function DeviceCell({ deviceType }: { deviceType: DeviceType }) {
  const metadata = deviceMetadata[deviceType]

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm">
      <Icon icon={metadata.icon} className="size-4 text-muted-foreground" />
      {metadata.label}
    </span>
  )
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function normalizeFilters(search: DashboardSearch, categories: string[]) {
  const priority = priorityLevels.includes(Number(search.priority) as PriorityLevel)
    ? String(search.priority)
    : allFilterValue
  const device = deviceTypes.includes(search.device as DeviceType)
    ? String(search.device)
    : allFilterValue
  const category = search.category && categories.includes(search.category)
    ? search.category
    : allFilterValue

  return {
    priority,
    device,
    category,
    store: search.storeId ?? search.store ?? '',
  }
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

function applyIssueFilters(
  issues: NocIssue[],
  filters: ReturnType<typeof normalizeFilters>,
) {
  const storeQuery = filters.store.trim().toLowerCase()

  return issues.filter((issue) => {
    const matchesPriority =
      filters.priority === allFilterValue || issue.priority === Number(filters.priority)
    const matchesDevice =
      filters.device === allFilterValue || issue.deviceType === filters.device
    const matchesCategory =
      filters.category === allFilterValue || issue.category === filters.category
    const matchesStore =
      storeQuery === '' || issue.storeId.toLowerCase().includes(storeQuery)

    return matchesPriority && matchesDevice && matchesCategory && matchesStore
  })
}

function buildDashboardMetrics(issues: NocIssue[]) {
  const affectedStores = new Set(issues.map((issue) => issue.storeId)).size
  const priorityRows = priorityLevels.map((priority) => ({
    priority,
    shortLabel: `P${priority}`,
    count: issues.filter((issue) => issue.priority === priority).length,
  }))
  const deviceRows = deviceTypes.map((deviceType) => ({
    deviceType,
    label: deviceMetadata[deviceType].label,
    count: issues.filter((issue) => issue.deviceType === deviceType).length,
  }))
  const lteRows = issues
    .filter((issue) => issue.deviceType === 'LTE')
    .map((issue) => ({
      id: issue.id,
      storeId: issue.storeId,
      dataUsageGb: issue.dataUsageGb ?? 0,
      highUsage: (issue.dataUsageGb ?? 0) >= highUsageThresholdGb,
    }))
    .sort((a, b) => b.dataUsageGb - a.dataUsageGb)
  const totalLteUsageGb = lteRows.reduce((total, row) => total + row.dataUsageGb, 0)

  return {
    affectedStores,
    totalIssues: issues.length,
    priorityOneCount: priorityRows.find((row) => row.priority === 1)?.count ?? 0,
    highAlertCount: issues.filter((issue) => issue.priority <= 2 || issue.priority === 5)
      .length,
    lteStoreCount: lteRows.length,
    totalLteUsageGb,
    priorityRows,
    deviceRows,
    lteRows,
  }
}

function buildKpiCards(metrics: ReturnType<typeof buildDashboardMetrics>): KpiCard[] {
  return [
    {
      label: 'Affected stores',
      value: String(metrics.affectedStores),
      detail: `${metrics.totalIssues} active issue${metrics.totalIssues === 1 ? '' : 's'}`,
      icon: 'tabler:building-store',
      intent: 'neutral',
    },
    {
      label: 'Priority 1',
      value: String(metrics.priorityOneCount),
      detail: 'Business Central offline',
      icon: dashboardIcons.alert,
      intent: metrics.priorityOneCount > 0 ? 'critical' : 'good',
    },
    {
      label: 'LTE backup',
      value: String(metrics.lteStoreCount),
      detail: 'Stores currently on LTE',
      icon: dashboardIcons.lte,
      intent: 'watch',
    },
    {
      label: 'High alerts',
      value: String(metrics.highAlertCount),
      detail: 'Priority 1, 2, and alert rows',
      icon: 'tabler:bell-ringing',
      intent: metrics.highAlertCount > 0 ? 'critical' : 'good',
    },
    {
      label: 'Total LTE usage',
      value: formatGb(metrics.totalLteUsageGb),
      detail: `Across ${metrics.lteStoreCount} LTE store${metrics.lteStoreCount === 1 ? '' : 's'}`,
      icon: 'tabler:database',
      intent: 'neutral',
    },
  ]
}

function kpiCardClass(intent: KpiCard['intent']) {
  if (intent === 'critical') {
    return 'border-l-4 border-l-destructive'
  }
  if (intent === 'watch') {
    return 'border-l-4 border-l-blue-600'
  }
  if (intent === 'good') {
    return 'border-l-4 border-l-emerald-600'
  }
  return 'border-l-4 border-l-slate-400'
}

function formatGb(value: number) {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} GB`
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
