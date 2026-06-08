import type { DeviceType, PriorityLevel } from './types'

export type PrioritySeverity = 'critical' | 'high' | 'medium' | 'watch' | 'info'

export type DashboardColorIntent =
  | 'destructive'
  | 'warning'
  | 'orange'
  | 'primary'
  | 'muted'

export type PriorityMetadata = {
  label: string
  description: string
  severity: PrioritySeverity
  colorIntent: DashboardColorIntent
  icon: string
  sortOrder: number
}

export type DeviceMetadata = {
  label: string
  icon: string
}

export const priorityMetadata = {
  1: {
    label: 'Priority 1',
    description: 'Business Central offline',
    severity: 'critical',
    colorIntent: 'destructive',
    icon: 'tabler:alert-triangle',
    sortOrder: 1,
  },
  2: {
    label: 'Priority 2',
    description: 'InHand offline',
    severity: 'high',
    colorIntent: 'warning',
    icon: 'tabler:antenna-bars-off',
    sortOrder: 2,
  },
  3: {
    label: 'Priority 3',
    description: 'Cradlepoint offline',
    severity: 'medium',
    colorIntent: 'orange',
    icon: 'tabler:router-off',
    sortOrder: 3,
  },
  4: {
    label: 'Priority 4',
    description: 'Store on LTE backup',
    severity: 'watch',
    colorIntent: 'primary',
    icon: 'tabler:cell-signal-5',
    sortOrder: 4,
  },
  5: {
    label: 'Priority 5',
    description: 'CP and InHand alerts',
    severity: 'info',
    colorIntent: 'muted',
    icon: 'tabler:bell-ringing',
    sortOrder: 5,
  },
} as const satisfies Record<PriorityLevel, PriorityMetadata>

export const deviceMetadata = {
  PBX: {
    label: 'PBX',
    icon: 'tabler:phone',
  },
  InHand: {
    label: 'InHand',
    icon: 'tabler:antenna-bars-5',
  },
  Cradlepoint: {
    label: 'Cradlepoint',
    icon: 'tabler:router',
  },
  LTE: {
    label: 'LTE backup',
    icon: 'tabler:cell-signal-5',
  },
  Unknown: {
    label: 'Unknown device',
    icon: 'tabler:question-mark',
  },
} as const satisfies Record<DeviceType, DeviceMetadata>

export const priorityCategories = {
  1: 'Business Central Offline',
  2: 'InHand Offline',
  3: 'Cradlepoint Offline',
  4: 'On LTE',
  5: 'CP and InHand Alerts',
} as const satisfies Record<PriorityLevel, string>
