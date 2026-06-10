import { Icon } from '@iconify/react'

import { lteHighUsageThresholdGb } from '@/lib/noc-data'

export function DashboardTargets() {
  const targets = [
    { icon: 'tabler:target-arrow', label: 'BC Offline: 0' },
    { icon: 'tabler:router', label: 'IH/CP Offline: < 3' },
    { icon: 'tabler:cell-signal-5', label: `LTE High Usage: < 5 stores over ${lteHighUsageThresholdGb}GB` },
    { icon: 'tabler:bell-ringing', label: 'Alerts: monitor current report' },
    { icon: 'tabler:star-filled', label: 'Focus on prevention. Drive stability.' },
  ]

  return (
    <section className="rounded-xl border bg-white px-4 py-3 shadow-[var(--dashboard-panel-shadow)]">
      <div className="grid gap-3 text-xs font-medium text-slate-600 sm:grid-cols-2 xl:grid-cols-5">
        {targets.map((target) => (
          <div key={target.label} className="flex items-center gap-2">
            <Icon icon={target.icon} className="size-5 text-slate-500" />
            <span>{target.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
