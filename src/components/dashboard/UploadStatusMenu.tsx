import { Icon } from '@iconify/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ParserWarning } from '@/lib/noc-data'
import { cn } from '@/lib/utils'

export type UploadStatusKind = 'idle' | 'processing' | 'success' | 'partial' | 'error'

export type UploadStatusView = {
  kind: UploadStatusKind
  message: string
}

type UploadStatusMenuProps = {
  status: UploadStatusView
  warnings: ParserWarning[]
}

export function UploadStatusMenu({ status, warnings }: UploadStatusMenuProps) {
  const visibleWarnings = warnings.slice(0, 12)
  const hiddenWarningCount = warnings.length - visibleWarnings.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(
            'gap-1.5 border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white',
            status.kind === 'error' && 'bg-red-500/25 hover:bg-red-500/35',
            status.kind === 'partial' && 'bg-amber-400/20 hover:bg-amber-400/30',
          )}
        >
          <Icon
            icon={statusIcon(status.kind)}
            className={cn('size-3.5', status.kind === 'processing' && 'animate-spin')}
          />
          {warnings.length > 0 ? `${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : status.message}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-3 py-2">
          <span>Import status</span>
          <Badge variant={status.kind === 'error' ? 'destructive' : 'secondary'}>{status.kind}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="px-3 py-2 text-sm text-muted-foreground">{status.message}</div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-72 overflow-auto">
          {warnings.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">No upload warnings.</div>
          ) : (
            visibleWarnings.map((warning, index) => (
              <div key={`${warning.code}-${warning.rowNumber ?? index}`} className="border-b px-3 py-2 text-sm last:border-b-0">
                <div className="font-medium text-foreground">{formatWarningCode(warning.code)}</div>
                <div className="text-xs text-muted-foreground">
                  {warning.rowNumber ? `row ${warning.rowNumber}` : 'report'}
                  {warning.priority ? ` - Priority ${warning.priority}` : ''}
                </div>
                <p className="mt-1 text-muted-foreground">{warning.message}</p>
              </div>
            ))
          )}
          {hiddenWarningCount > 0 ? (
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
              {hiddenWarningCount} more hidden.
            </div>
          ) : null}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function statusIcon(status: UploadStatusKind) {
  if (status === 'processing') {
    return 'tabler:loader-2'
  }
  if (status === 'error') {
    return 'tabler:alert-circle'
  }
  if (status === 'partial') {
    return 'tabler:alert-triangle'
  }
  if (status === 'idle') {
    return 'tabler:file-upload'
  }
  return 'tabler:circle-check'
}

function formatWarningCode(code: string) {
  return code
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
