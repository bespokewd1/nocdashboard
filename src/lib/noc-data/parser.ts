import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import { priorityCategories } from './metadata'
import { nocIssueSchema } from './schemas'
import type {
  DetectedPrioritySection,
  DeviceType,
  NocImportResult,
  NocIssue,
  NormalizedIssueCandidate,
  ParserWarning,
  PriorityLevel,
  RawCsvRow,
  RawReportRow,
} from './types'

const priorityHeaderPattern = /^priority\s*([1-5])$/i

const priorityDeviceDefaults = {
  1: 'PBX',
  2: 'InHand',
  3: 'Cradlepoint',
  4: 'LTE',
  5: 'Unknown',
} as const satisfies Record<PriorityLevel, DeviceType>

const priorityFiveDeviceCodes: Record<string, DeviceType> = {
  CP: 'Cradlepoint',
  CRADLEPOINT: 'Cradlepoint',
  IH: 'InHand',
  INHAND: 'InHand',
  'IN HAND': 'InHand',
  LTE: 'LTE',
  PBX: 'PBX',
}

export function parseCsvRows(csvText: string): {
  rows: RawReportRow[]
  warnings: ParserWarning[]
} {
  const parseResult = Papa.parse<RawCsvRow>(csvText, {
    skipEmptyLines: false,
  })

  const warnings: ParserWarning[] = parseResult.errors.map((error) => ({
    code: 'csv_parse_error',
    message: error.message,
    rowNumber: error.row === undefined ? undefined : error.row + 1,
  }))

  const rows = parseResult.data.map((cells, index) => ({
    rowNumber: index + 1,
    cells: normalizeCells(cells),
  }))

  return { rows, warnings }
}

export function parseXlsxRows(fileBuffer: ArrayBuffer): {
  rows: RawReportRow[]
  warnings: ParserWarning[]
} {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    return {
      rows: [],
      warnings: [
        {
          code: 'xlsx_parse_error',
          message: 'The workbook does not contain a worksheet to import.',
        },
      ],
    }
  }

  const worksheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: true,
    defval: '',
  })

  return {
    rows: rawRows.map((cells, index) => ({
      rowNumber: index + 1,
      cells: normalizeCells(cells.map((cell) => String(cell ?? ''))),
    })),
    warnings: [],
  }
}

export function detectPrioritySections(rows: RawReportRow[]): {
  sections: DetectedPrioritySection[]
  warnings: ParserWarning[]
} {
  const sections: DetectedPrioritySection[] = []
  const warnings: ParserWarning[] = []
  let currentSection: DetectedPrioritySection | undefined

  for (const row of rows) {
    const priority = readPriorityHeader(row.cells)

    if (priority) {
      currentSection = {
        priority,
        sourceSection: `Priority ${priority}`,
        category: priorityCategories[priority],
        startRowNumber: row.rowNumber,
        rows: [],
      }
      sections.push(currentSection)
      continue
    }

    if (isInvalidPriorityHeader(row.cells)) {
      warnings.push({
        code: 'invalid_priority',
        message: 'Skipped an unsupported priority section header.',
        rowNumber: row.rowNumber,
        rawRow: row.cells,
      })
      currentSection = undefined
      continue
    }

    if (isBlankRow(row.cells)) {
      continue
    }

    if (!currentSection) {
      warnings.push({
        code: 'row_outside_priority_section',
        message: 'Skipped a row before the first priority section.',
        rowNumber: row.rowNumber,
        rawRow: row.cells,
      })
      continue
    }

    if (isLikelySectionTitle(row.cells)) {
      currentSection.category = firstFilledCell(row.cells) ?? currentSection.category
      continue
    }

    if (isHeaderRow(row.cells)) {
      continue
    }

    currentSection.rows.push(row)
  }

  return { sections, warnings }
}

export function normalizeSections(sections: DetectedPrioritySection[]): {
  issues: NocIssue[]
  warnings: ParserWarning[]
} {
  const issues: NocIssue[] = []
  const warnings: ParserWarning[] = []

  for (const section of sections) {
    for (const row of section.rows) {
      const result = normalizeSectionRow(section, row)
      warnings.push(...result.warnings)

      if (result.issue) {
        issues.push(result.issue)
      }
    }
  }

  return { issues, warnings }
}

export function validateIssues(issues: NocIssue[]): {
  issues: NocIssue[]
  warnings: ParserWarning[]
} {
  const validIssues: NocIssue[] = []
  const warnings: ParserWarning[] = []

  for (const issue of issues) {
    const validation = nocIssueSchema.safeParse(issue)

    if (validation.success) {
      validIssues.push(validation.data)
      continue
    }

    warnings.push({
      code: 'invalid_issue',
      message: validation.error.issues
        .map((validationIssue) => validationIssue.message)
        .join('; '),
      priority: issue.priority,
      rawRow: issueToWarningRow(issue),
    })
  }

  return { issues: validIssues, warnings }
}

export function parseNocCsvReport(csvText: string): NocImportResult {
  const csv = parseCsvRows(csvText)
  return parseNocReportRows(csv.rows, csv.warnings)
}

export function parseNocXlsxReport(fileBuffer: ArrayBuffer): NocImportResult {
  const xlsx = parseXlsxRows(fileBuffer)
  return parseNocReportRows(xlsx.rows, xlsx.warnings)
}

export function parseNocReportRows(
  rows: RawReportRow[],
  initialWarnings: ParserWarning[] = [],
): NocImportResult {
  const detected = detectPrioritySections(rows)
  const normalized = normalizeSections(detected.sections)
  const validated = validateIssues(normalized.issues)
  const warnings = [
    ...initialWarnings,
    ...detected.warnings,
    ...normalized.warnings,
    ...validated.warnings,
  ]
  const invalidRows = warnings.filter((warning) =>
    ['missing_store_id', 'invalid_issue'].includes(warning.code),
  ).length

  return {
    issues: validated.issues,
    warnings,
    sections: detected.sections,
    stats: {
      totalRows: rows.length,
      dataRows: detected.sections.reduce(
        (count, section) => count + section.rows.length,
        0,
      ),
      validIssues: validated.issues.length,
      invalidRows,
      warningCount: warnings.length,
    },
  }
}

export function parseDataUsageGb(rawValue: string | undefined): number | undefined {
  const value = rawValue?.trim()

  if (!value) {
    return undefined
  }

  const match = value.match(/^([\d,.]+)\s*(gb|g)?$/i)

  if (!match) {
    return undefined
  }

  const parsed = Number.parseFloat(match[1].replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

export function mapPriorityFiveDevice(rawValue: string | undefined): {
  deviceType: DeviceType
  warning?: ParserWarning
} {
  const normalizedValue = rawValue?.trim().toUpperCase()

  if (!normalizedValue) {
    return { deviceType: 'Unknown' }
  }

  const deviceType = priorityFiveDeviceCodes[normalizedValue]

  if (deviceType) {
    return { deviceType }
  }

  return {
    deviceType: 'Unknown',
    warning: {
      code: 'unknown_device_type',
      message: `Mapped unexpected Priority 5 device value "${rawValue}" to Unknown.`,
      rawRow: rawValue === undefined ? undefined : [rawValue],
    },
  }
}

function normalizeSectionRow(
  section: DetectedPrioritySection,
  row: RawReportRow,
): NormalizedIssueCandidate {
  const warnings: ParserWarning[] = []
  const storeId = cleanCell(row.cells[0])

  if (!storeId) {
    return {
      warnings: [
        {
          code: 'missing_store_id',
          message: 'Skipped a row without a store ID.',
          rowNumber: row.rowNumber,
          priority: section.priority,
          rawRow: row.cells,
        },
      ],
    }
  }

  const deviceMapping =
    section.priority === 5
      ? mapPriorityFiveDevice(row.cells[1])
      : { deviceType: priorityDeviceDefaults[section.priority] }

  if (deviceMapping.warning) {
    warnings.push({
      ...deviceMapping.warning,
      rowNumber: row.rowNumber,
      priority: section.priority,
      rawRow: row.cells,
    })
  }

  const rawDataUsage =
    section.priority === 4 ? cleanCell(row.cells[1]) : undefined
  const dataUsageGb = parseDataUsageGb(rawDataUsage)

  if (rawDataUsage && dataUsageGb === undefined) {
    warnings.push({
      code: 'invalid_data_usage',
      message: `Could not parse LTE usage value "${rawDataUsage}".`,
      rowNumber: row.rowNumber,
      priority: section.priority,
      rawRow: row.cells,
    })
  }

  const ticketUrl = cleanCell(row.cells[2])
  const notes = cleanCell(row.cells[3])

  return {
    issue: {
      id: buildIssueId(section.priority, storeId, row.rowNumber),
      storeId,
      priority: section.priority,
      category: section.category,
      deviceType: deviceMapping.deviceType,
      ticketUrl,
      notes,
      dataUsageGb,
      rawDataUsage,
      sourceSection: section.sourceSection,
    },
    warnings,
  }
}

function normalizeCells(cells: RawCsvRow): RawCsvRow {
  return cells.map((cell) => String(cell ?? '').trim())
}

function readPriorityHeader(cells: RawCsvRow): PriorityLevel | undefined {
  const firstCell = firstFilledCell(cells)
  const match = firstCell?.match(priorityHeaderPattern)
  const priority = match ? Number(match[1]) : undefined

  return isPriorityLevel(priority) ? priority : undefined
}

function isInvalidPriorityHeader(cells: RawCsvRow): boolean {
  const firstCell = firstFilledCell(cells)
  const match = firstCell?.match(/^priority\s*(\d+)$/i)
  return Boolean(match && !isPriorityLevel(Number(match[1])))
}

function isPriorityLevel(value: number | undefined): value is PriorityLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function isBlankRow(cells: RawCsvRow): boolean {
  return cells.every((cell) => cleanCell(cell) === undefined)
}

function isHeaderRow(cells: RawCsvRow): boolean {
  const normalizedCells = cells.map((cell) =>
    cleanCell(cell)?.replace(/:$/, '').toLowerCase(),
  )

  return normalizedCells.includes('store') || normalizedCells.includes('ticket')
}

function isLikelySectionTitle(cells: RawCsvRow): boolean {
  const filledCells = cells.map(cleanCell).filter(Boolean)
  const title = filledCells[0]
  return filledCells.length === 1 && title !== undefined && !/^\d+$/.test(title)
}

function firstFilledCell(cells: RawCsvRow): string | undefined {
  return cells.map(cleanCell).find(Boolean)
}

function cleanCell(cell: string | undefined): string | undefined {
  const trimmed = cell?.trim()
  return trimmed ? trimmed : undefined
}

function buildIssueId(
  priority: PriorityLevel,
  storeId: string,
  rowNumber: number,
): string {
  return `p${priority}-${storeId}-${rowNumber}`
}

function issueToWarningRow(issue: NocIssue): RawCsvRow {
  return [
    issue.storeId,
    String(issue.priority),
    issue.category,
    issue.deviceType,
    issue.ticketUrl ?? '',
    issue.rawDataUsage ?? '',
    issue.notes ?? '',
  ]
}
