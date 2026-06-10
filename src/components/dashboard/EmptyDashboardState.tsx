import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/button'

type EmptyDashboardStateProps = {
  isLoadingDemo: boolean
  onUploadClick: () => void
  onLoadDemo: () => void
}

export function EmptyDashboardState({ isLoadingDemo, onUploadClick, onLoadDemo }: EmptyDashboardStateProps) {
  return (
    <section className="rounded-xl border border-dashed bg-white p-8 text-center shadow-[var(--dashboard-panel-shadow)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Icon icon="tabler:file-upload" className="size-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">No report loaded</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
        Upload a CSV or XLSX NOC report, or load the included demo report to preview the operations dashboard.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button type="button" className="gap-2" onClick={onUploadClick}>
          <Icon icon="tabler:upload" className="size-4" />
          Upload report
        </Button>
        <Button type="button" variant="outline" className="gap-2" disabled={isLoadingDemo} onClick={onLoadDemo}>
          <Icon icon={isLoadingDemo ? 'tabler:loader-2' : 'tabler:database-import'} className={isLoadingDemo ? 'size-4 animate-spin' : 'size-4'} />
          Load demo report
        </Button>
      </div>
    </section>
  )
}
