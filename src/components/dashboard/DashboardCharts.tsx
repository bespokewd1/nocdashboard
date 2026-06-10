import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'
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

import type { DashboardMetrics, DeviceType, PriorityLevel } from '@/lib/noc-data'

type DashboardChartsProps = {
  metrics: DashboardMetrics
  hasReport: boolean
}

const priorityChartColors: Record<PriorityLevel, string> = {
  1: '#dc2626',
  2: '#f97316',
  3: '#f59e0b',
  4: '#2563eb',
  5: '#0f9f9a',
}

const deviceChartColors: Record<DeviceType, string> = {
  PBX: '#334155',
  InHand: '#0f9f9a',
  Cradlepoint: '#7c3aed',
  LTE: '#d99a00',
  Unknown: '#94a3b8',
}

export function DashboardCharts({ metrics, hasReport }: DashboardChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_1fr]">
      <ChartPanel title="Current Report Overview" icon="tabler:chart-line" headerClassName="bg-[var(--dashboard-navy)]">
        <div className="h-60">
          {hasReport && metrics.totalIssues > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.priorityRows} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: 'rgba(148, 163, 184, 0.14)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {metrics.priorityRows.map((row) => <Cell key={row.priority} fill={priorityChartColors[row.priority]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No report data available." />
          )}
        </div>
        <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-slate-600">Current report only. Historical daily trend requires report history.</p>
      </ChartPanel>

      <ChartPanel title="Alerts Summary" icon="tabler:bell-ringing" headerClassName="bg-[var(--dashboard-teal)]">
        <div className="grid min-h-60 gap-3 sm:grid-cols-[0.9fr_1fr] xl:grid-cols-1 2xl:grid-cols-[0.9fr_1fr]">
          {hasReport && metrics.totalAlerts > 0 ? (
            <>
              <div className="h-44 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.alertSplitRows} dataKey="count" nameKey="label" innerRadius={46} outerRadius={72} paddingAngle={2}>
                      {metrics.alertSplitRows.map((row) => <Cell key={row.deviceType} fill={deviceChartColors[row.deviceType]} />)}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="text-center text-sm font-semibold text-slate-900">{metrics.totalAlerts} Total Alerts</div>
                {metrics.alertSplitRows.map((row) => (
                  <div key={row.deviceType} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-slate-600"><span className="size-3 rounded-full" style={{ backgroundColor: deviceChartColors[row.deviceType] }} />{row.label}</span>
                    <span className="font-semibold">{row.count} ({row.percent}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart message={hasReport ? 'No P5 alerts in view.' : 'No report data available.'} />
          )}
        </div>
      </ChartPanel>

      <ChartPanel title="LTE Usage Snapshot" icon="tabler:chart-bar" headerClassName="bg-[var(--dashboard-gold)]">
        <div className="space-y-3">
          {hasReport && metrics.lteRows.length > 0 ? (
            metrics.lteRows.slice(0, 6).map((row) => (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">Store {row.storeId}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.dataUsageGb === undefined ? '-' : formatGb(row.dataUsageGb)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[var(--dashboard-gold)]" style={{ width: `${Math.min(100, row.usagePercent ?? 0)}%` }} />
                </div>
              </div>
            ))
          ) : (
            <EmptyChart message={hasReport ? 'No LTE usage rows in view.' : 'No report data available.'} />
          )}
        </div>
      </ChartPanel>
    </section>
  )
}

function ChartPanel({ title, icon, headerClassName, children }: { title: string; icon: string; headerClassName: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-[var(--dashboard-panel-shadow)] ring-1 ring-slate-200/80">
      <div className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white ${headerClassName}`}>
        <Icon icon={icon} className="size-5" />
        {title}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-center text-sm text-slate-500">{message}</div>
}

function formatGb(value: number) {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} GB`
}
