import { parseNocCsvReport, parseNocXlsxReport } from './parser'
import type { NocImportResult } from './types'

export type ReportDataSource = {
  importReport: (file: File) => Promise<NocImportResult>
}

export const browserUploadReportDataSource: ReportDataSource = {
  async importReport(file) {
    return file.name.toLowerCase().endsWith('.xlsx')
      ? parseNocXlsxReport(await file.arrayBuffer())
      : parseNocCsvReport(await file.text())
  },
}

export function isSupportedReportFile(file: Pick<File, 'name'>) {
  const normalizedName = file.name.toLowerCase()
  return normalizedName.endsWith('.csv') || normalizedName.endsWith('.xlsx')
}
