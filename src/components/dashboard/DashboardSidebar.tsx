import type { ReactNode } from 'react'
import { Icon } from '@iconify/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { deviceMetadata, deviceTypes, priorityLevels, priorityMetadata } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

export type DashboardFilters = {
  priority: string
  device: string
  category: string
  store: string
}

type DashboardSidebarProps = {
  filters: DashboardFilters
  categories: string[]
  activeFilterCount: number
  dataAsOfLabel: string
  disabled: boolean
  className?: string
  onFilterChange: (key: 'priority' | 'device' | 'category' | 'storeId', value: string) => void
  onClearFilters: () => void
}

const allFilterValue = 'all'

const priorityLegendClass: Record<number, string> = {
  1: 'bg-red-600',
  2: 'bg-orange-500',
  3: 'bg-amber-400 text-slate-950',
  4: 'bg-blue-600',
  5: 'bg-teal-600',
}

export function DashboardSidebar({
  filters,
  categories,
  activeFilterCount,
  dataAsOfLabel,
  disabled,
  className,
  onFilterChange,
  onClearFilters,
}: DashboardSidebarProps) {
  return (
    <aside className={cn('rounded-xl border border-white/10 bg-[var(--dashboard-navy)] p-4 text-white shadow-xl shadow-slate-950/15 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:border-t-0', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h2>
        {activeFilterCount > 0 ? (
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-sky-100 hover:bg-white/10 hover:text-white" onClick={onClearFilters}>
            {activeFilterCount} active
          </Button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        <FilterField label="Date">
          <div className="flex h-9 items-center justify-between rounded-md border border-white/20 bg-[var(--dashboard-navy-deep)] px-3 text-sm text-sky-50">
            <span>{dataAsOfLabel}</span>
            <Icon icon="tabler:calendar" className="size-4 text-sky-100/70" />
          </div>
        </FilterField>

        <FilterField label="Store">
          <Input
            value={filters.store}
            onChange={(event) => onFilterChange('storeId', event.target.value)}
            placeholder="All stores"
            disabled={disabled}
            className="border-white/20 bg-[var(--dashboard-navy-deep)] text-white placeholder:text-sky-100/50 disabled:opacity-45"
          />
        </FilterField>

        <FilterField label="Priority">
          <Select value={filters.priority} onValueChange={(value) => onFilterChange('priority', value)} disabled={disabled}>
            <SelectTrigger className="border-white/20 bg-[var(--dashboard-navy-deep)] text-white disabled:opacity-45">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allFilterValue}>All priorities</SelectItem>
              {priorityLevels.map((priority) => (
                <SelectItem key={priority} value={String(priority)}>{priorityMetadata[priority].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Device">
          <Select value={filters.device} onValueChange={(value) => onFilterChange('device', value)} disabled={disabled}>
            <SelectTrigger className="border-white/20 bg-[var(--dashboard-navy-deep)] text-white disabled:opacity-45">
              <SelectValue placeholder="All devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allFilterValue}>All devices</SelectItem>
              {deviceTypes.map((deviceType) => (
                <SelectItem key={deviceType} value={deviceType}>{deviceMetadata[deviceType].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Category">
          <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)} disabled={disabled || categories.length === 0}>
            <SelectTrigger className="border-white/20 bg-[var(--dashboard-navy-deep)] text-white disabled:opacity-45">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allFilterValue}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="mt-8 rounded-xl bg-white p-4 text-slate-950 shadow-lg">
        <h3 className="text-sm font-bold uppercase tracking-wide">Legend</h3>
        <div className="mt-4 space-y-3">
          {priorityLevels.map((priority) => (
            <div key={priority} className="flex items-center gap-3 text-sm">
              <span className={cn('inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-bold text-white', priorityLegendClass[priority])}>P{priority}</span>
              <span>{priorityMetadata[priority].description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-sky-100/80">
        <Icon icon="tabler:info-circle" className="mb-2 size-4" />
        Dashboard data is processed locally from the selected report.
      </div>
    </aside>
  )
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-wider text-sky-100/80">{label}</span>
      {children}
    </label>
  )
}
