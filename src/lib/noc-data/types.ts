export const priorityLevels = [1, 2, 3, 4, 5] as const

export type PriorityLevel = (typeof priorityLevels)[number]

export const deviceTypes = [
  'PBX',
  'InHand',
  'Cradlepoint',
  'LTE',
  'Unknown',
] as const

export type DeviceType = (typeof deviceTypes)[number]

export type NocIssue = {
  id: string
  storeId: string
  priority: PriorityLevel
  category: string
  deviceType: DeviceType
  ticketUrl?: string
  notes?: string
  dataUsageGb?: number
  rawDataUsage?: string
  sourceSection?: string
}

export type RawCsvRow = string[]

export type RawReportRow = {
  rowNumber: number
  cells: RawCsvRow
}

export type DetectedPrioritySection = {
  priority: PriorityLevel
  sourceSection: string
  category: string
  startRowNumber: number
  rows: RawReportRow[]
}

export type ParserWarningCode =
  | 'csv_parse_error'
  | 'xlsx_parse_error'
  | 'invalid_priority'
  | 'row_outside_priority_section'
  | 'missing_store_id'
  | 'invalid_issue'
  | 'unknown_device_type'
  | 'invalid_data_usage'

export type ParserWarning = {
  code: ParserWarningCode
  message: string
  rowNumber?: number
  priority?: PriorityLevel
  rawRow?: RawCsvRow
}

export type NocImportStats = {
  totalRows: number
  dataRows: number
  validIssues: number
  invalidRows: number
  warningCount: number
}

export type NocImportResult = {
  issues: NocIssue[]
  warnings: ParserWarning[]
  sections: DetectedPrioritySection[]
  stats: NocImportStats
}

export type NormalizedIssueCandidate = {
  issue?: NocIssue
  warnings: ParserWarning[]
}
