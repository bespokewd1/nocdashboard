import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/button'
import { dashboardIcons } from '@/lib/dashboard-icons'
import type { ParserWarning } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

import { UploadStatusMenu, type UploadStatusView } from './UploadStatusMenu'

type DashboardTopBarProps = {
  reportName: string
  dataSourceLabel: string
  dataAsOfLabel: string
  lastUpdatedLabel: string
  uploadStatus: UploadStatusView
  warnings: ParserWarning[]
  isUploadBusy: boolean
  hasReport: boolean
  onUploadClick: () => void
  onClearReport: () => void
}

export function DashboardTopBar({
  reportName,
  dataSourceLabel,
  dataAsOfLabel,
  lastUpdatedLabel,
  uploadStatus,
  warnings,
  isUploadBusy,
  hasReport,
  onUploadClick,
  onClearReport,
}: DashboardTopBarProps) {
  return (
    <header className="bg-[var(--dashboard-navy)] text-white shadow-lg shadow-slate-950/20">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
            <Icon icon="tabler:wifi" className="size-10" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
              <span>QSR Network Operations</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 tracking-normal text-white">{dataSourceLabel}</span>
            </div>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">NOC Dashboard</h1>
            <p className="mt-1 truncate text-sm text-sky-100/80">{reportName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="grid gap-1 text-sm text-sky-100 sm:grid-cols-2 sm:gap-x-5 lg:text-right">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-100/70">Data as of</span>
              <div className="flex items-center gap-1.5 sm:justify-start lg:justify-end">
                <Icon icon="tabler:calendar" className="size-4" />
                {dataAsOfLabel}
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-100/70">Last updated</span>
              <div>{lastUpdatedLabel}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5 border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              disabled={isUploadBusy}
              onClick={onUploadClick}
            >
              <Icon icon={isUploadBusy ? 'tabler:loader-2' : dashboardIcons.upload} className={cn('size-4', isUploadBusy && 'animate-spin')} />
              Upload report
            </Button>
            {hasReport ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5 border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                disabled={isUploadBusy}
                onClick={onClearReport}
              >
                <Icon icon="tabler:trash-x" className="size-4" />
                Clear report
              </Button>
            ) : null}
            <UploadStatusMenu status={uploadStatus} warnings={warnings} />
          </div>
        </div>
      </div>
    </header>
  )
}
