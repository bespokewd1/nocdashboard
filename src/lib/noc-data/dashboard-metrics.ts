import { deviceMetadata, priorityMetadata } from './metadata'
import { deviceTypes, priorityLevels, type DeviceType, type NocIssue, type PriorityLevel } from './types'

export const lteHighUsageThresholdGb = 75
export const criticalOfflineLimit = 6
export const lteOverviewLimit = 5

export type LteUsageStatus = 'High' | 'Monitor' | 'Unknown'
export type LteUsageAction = 'Review usage' | 'Monitor' | 'Verify data'

export type PriorityMetricRow = {
  priority: PriorityLevel
  shortLabel: string
  label: string
  description: string
  count: number
}

export type DeviceMetricRow = {
  deviceType: DeviceType
  label: string
  count: number
}

export type CriticalOfflineRow = {
  id: string
  storeId: string
  priority: PriorityLevel
  priorityLabel: string
  type: string
  deviceType: DeviceType
  status: 'Down'
  ticketUrl?: string
  notes?: string
}

export type LteUsageRow = {
  id: string
  storeId: string
  dataUsageGb?: number
  rawDataUsage?: string
  usagePercent?: number
  status: LteUsageStatus
  action: LteUsageAction
  ticketUrl?: string
  notes?: string
}

export type AlertSplitRow = {
  deviceType: DeviceType
  label: string
  count: number
  percent: number
}

export type DashboardMetrics = {
  affectedStores: number
  totalIssues: number
  bcOfflineCount: number
  ihCpOfflineCount: number
  lteHighUsageCount: number
  lteStoreCount: number
  totalLteUsageGb: number
  totalAlerts: number
  priorityRows: PriorityMetricRow[]
  deviceRows: DeviceMetricRow[]
  criticalOfflineRows: CriticalOfflineRow[]
  lteRows: LteUsageRow[]
  alertSplitRows: AlertSplitRow[]
}

export function buildDashboardMetrics(issues: NocIssue[]): DashboardMetrics {
  const affectedStores = new Set(issues.map((issue) => issue.storeId)).size
  const priorityCounts = new Map<PriorityLevel, number>(priorityLevels.map((priority) => [priority, 0]))
  const deviceCounts = new Map<DeviceType, number>(deviceTypes.map((deviceType) => [deviceType, 0]))
  let totalLteUsageGb = 0

  for (const issue of issues) {
    priorityCounts.set(issue.priority, (priorityCounts.get(issue.priority) ?? 0) + 1)
    deviceCounts.set(issue.deviceType, (deviceCounts.get(issue.deviceType) ?? 0) + 1)
    if (issue.deviceType === 'LTE' && issue.dataUsageGb !== undefined) {
      totalLteUsageGb += issue.dataUsageGb
    }
  }

  const priorityRows = priorityLevels.map((priority) => ({
    priority,
    shortLabel: `P${priority}`,
    label: priorityMetadata[priority].label,
    description: priorityMetadata[priority].description,
    count: priorityCounts.get(priority) ?? 0,
  }))
  const deviceRows = deviceTypes.map((deviceType) => ({
    deviceType,
    label: deviceMetadata[deviceType].label,
    count: deviceCounts.get(deviceType) ?? 0,
  }))
  const lteRows = issues
    .filter((issue) => issue.deviceType === 'LTE')
    .map(toLteUsageRow)
    .sort(sortLteUsageRows)
  const alertIssues = issues.filter((issue) => issue.priority === 5)
  const alertSplitRows = deviceTypes
    .map((deviceType) => {
      const count = alertIssues.filter((issue) => issue.deviceType === deviceType).length
      return {
        deviceType,
        label: deviceMetadata[deviceType].label,
        count,
        percent: alertIssues.length === 0 ? 0 : Math.round((count / alertIssues.length) * 100),
      }
    })
    .filter((row) => row.count > 0)

  return {
    affectedStores,
    totalIssues: issues.length,
    bcOfflineCount: priorityCounts.get(1) ?? 0,
    ihCpOfflineCount: (priorityCounts.get(2) ?? 0) + (priorityCounts.get(3) ?? 0),
    lteHighUsageCount: lteRows.filter((row) => row.status === 'High').length,
    lteStoreCount: lteRows.length,
    totalLteUsageGb,
    totalAlerts: alertIssues.length,
    priorityRows,
    deviceRows,
    criticalOfflineRows: issues
      .filter((issue) => issue.priority >= 1 && issue.priority <= 3)
      .map(toCriticalOfflineRow)
      .sort(sortCriticalOfflineRows),
    lteRows,
    alertSplitRows,
  }
}

export function getTopCriticalOfflineRows(metrics: DashboardMetrics) {
  return metrics.criticalOfflineRows.slice(0, criticalOfflineLimit)
}

export function getTopLteUsageRows(metrics: DashboardMetrics) {
  return metrics.lteRows.slice(0, lteOverviewLimit)
}

function toCriticalOfflineRow(issue: NocIssue): CriticalOfflineRow {
  return {
    id: issue.id,
    storeId: issue.storeId,
    priority: issue.priority,
    priorityLabel: `P${issue.priority}`,
    type: issue.category,
    deviceType: issue.deviceType,
    status: 'Down',
    ticketUrl: issue.ticketUrl,
    notes: issue.notes,
  }
}

function toLteUsageRow(issue: NocIssue): LteUsageRow {
  const usagePercent =
    issue.dataUsageGb === undefined
      ? undefined
      : Math.round((issue.dataUsageGb / lteHighUsageThresholdGb) * 100)
  const status = getLteUsageStatus(issue.dataUsageGb)

  return {
    id: issue.id,
    storeId: issue.storeId,
    dataUsageGb: issue.dataUsageGb,
    rawDataUsage: issue.rawDataUsage,
    usagePercent,
    status,
    action: getLteUsageAction(status),
    ticketUrl: issue.ticketUrl,
    notes: issue.notes,
  }
}

function getLteUsageStatus(dataUsageGb: number | undefined): LteUsageStatus {
  if (dataUsageGb === undefined) {
    return 'Unknown'
  }
  return dataUsageGb >= lteHighUsageThresholdGb ? 'High' : 'Monitor'
}

function getLteUsageAction(status: LteUsageStatus): LteUsageAction {
  if (status === 'High') {
    return 'Review usage'
  }
  if (status === 'Unknown') {
    return 'Verify data'
  }
  return 'Monitor'
}

function sortCriticalOfflineRows(a: CriticalOfflineRow, b: CriticalOfflineRow) {
  if (a.priority !== b.priority) {
    return a.priority - b.priority
  }
  const aHasContext = Number(Boolean(a.ticketUrl || a.notes))
  const bHasContext = Number(Boolean(b.ticketUrl || b.notes))
  if (aHasContext !== bHasContext) {
    return bHasContext - aHasContext
  }
  return a.storeId.localeCompare(b.storeId, undefined, { numeric: true })
}

function sortLteUsageRows(a: LteUsageRow, b: LteUsageRow) {
  const usageDelta = (b.dataUsageGb ?? -1) - (a.dataUsageGb ?? -1)
  if (usageDelta !== 0) {
    return usageDelta
  }
  return a.storeId.localeCompare(b.storeId, undefined, { numeric: true })
}
