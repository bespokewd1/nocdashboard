import { Icon } from '@iconify/react'

import type { DashboardMetrics } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

type ExecutiveSummaryProps = {
  metrics: DashboardMetrics
  hasReport: boolean
  isFiltered: boolean
}

type SummaryCard = {
  label: string
  value: string
  detail: string
  icon: string
  colorClass: string
}

export function ExecutiveSummary({ metrics, hasReport, isFiltered }: ExecutiveSummaryProps) {
  const cards: SummaryCard[] = [
    {
      label: 'BC Offline (P1)',
      value: String(metrics.bcOfflineCount),
      detail: metrics.bcOfflineCount > 0 ? 'Critical attention' : 'Target: 0',
      icon: 'tabler:server-off',
      colorClass: 'border-t-red-600 text-red-600',
    },
    {
      label: 'IH + CP Offline (P2-P3)',
      value: String(metrics.ihCpOfflineCount),
      detail: 'Target: fewer than 3',
      icon: 'tabler:router-off',
      colorClass: 'border-t-orange-500 text-orange-500',
    },
    {
      label: 'LTE High Usage (P4)',
      value: String(metrics.lteHighUsageCount),
      detail: `${metrics.lteStoreCount} LTE store${metrics.lteStoreCount === 1 ? '' : 's'} total`,
      icon: 'tabler:cell-signal-5',
      colorClass: 'border-t-amber-500 text-amber-500',
    },
    {
      label: 'Total Alerts (P5)',
      value: String(metrics.totalAlerts),
      detail: 'CP and InHand alerts',
      icon: 'tabler:bell-ringing',
      colorClass: 'border-t-teal-600 text-teal-600',
    },
    {
      label: 'Affected Stores',
      value: String(metrics.affectedStores),
      detail: `${metrics.totalIssues} active issue${metrics.totalIssues === 1 ? '' : 's'}`,
      icon: 'tabler:building-store',
      colorClass: 'border-t-slate-500 text-slate-600',
    },
  ]

  return (
    <section aria-labelledby="executive-summary" className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="executive-summary" className="text-base font-bold uppercase tracking-wide text-slate-900">Executive Summary</h2>
          <p className="text-sm text-slate-500">Focus on what matters. Act on what is critical.</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {!hasReport ? 'No report loaded' : isFiltered ? 'Filtered view' : 'Current report only'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className={cn('rounded-xl border-t-4 bg-white p-4 shadow-[var(--dashboard-panel-shadow)] ring-1 ring-slate-200/80', card.colorClass)}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{hasReport ? card.value : '0'}</div>
              </div>
              <Icon icon={card.icon} className="size-10 shrink-0 opacity-90" />
            </div>
            <div className="mt-2 text-xs text-slate-500">{hasReport ? card.detail : 'Upload or load demo data'}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
