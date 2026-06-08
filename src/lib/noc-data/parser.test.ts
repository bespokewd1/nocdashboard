import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  detectPrioritySections,
  mapPriorityFiveDevice,
  nocIssueSchema,
  parseCsvRows,
  parseDataUsageGb,
  parseNocCsvReport,
} from './index'
import type { NocIssue } from './types'

describe('NOC CSV parser', () => {
  it('parses the provided mock report into normalized issues', () => {
    const csv = readFileSync(
      join(process.cwd(), 'mock_data_for_noc_dashboard_sheet1.csv'),
      'utf8',
    )

    const result = parseNocCsvReport(csv)

    assert.equal(result.sections.length, 5)
    assert.equal(result.issues.length, 35)
    assert.equal(result.stats.dataRows, 35)
    assert.equal(result.stats.validIssues, 35)
    assert.equal(result.stats.invalidRows, 0)
    assert.equal(result.warnings.length, 0)

    assert.deepEqual(
      result.sections.map((section) => [
        section.priority,
        section.category,
        section.rows.length,
      ]),
      [
        [1, 'Business Central Offline', 7],
        [2, 'InHand Offline', 7],
        [3, 'Cradlepoint Offline', 7],
        [4, 'On LTE', 7],
        [5, 'CP and InHand Alerts', 7],
      ],
    )

    const quotedNote = result.issues.find(
      (issue) => issue.storeId === '1234' && issue.priority === 1,
    )
    assert.equal(quotedNote?.notes, 'BC offline, email sent')
    assert.equal(quotedNote?.deviceType, 'PBX')

    const lteIssue = result.issues.find(
      (issue) => issue.storeId === '1234' && issue.priority === 4,
    )
    assert.equal(lteIssue?.deviceType, 'LTE')
    assert.equal(lteIssue?.rawDataUsage, '100 GB')
    assert.equal(lteIssue?.dataUsageGb, 100)

    const highAlertIssue = result.issues.find(
      (issue) => issue.storeId === '1201' && issue.priority === 5,
    )
    assert.equal(highAlertIssue?.deviceType, 'InHand')
  })

  it('keeps blank rows out of sections and detects headers with extra whitespace', () => {
    const csv = [
      ',,,',
      ' Priority 3 ,,,',
      'Cradlepoint Offline,,,',
      ',,,',
      'Store:,,Ticket:,Notes:',
      '7001,,https://support.it/tickets/1,"CP offline, quoted note"',
    ].join('\n')

    const rows = parseCsvRows(csv)
    const result = detectPrioritySections(rows.rows)

    assert.equal(result.sections.length, 1)
    assert.equal(result.sections[0].priority, 3)
    assert.equal(result.sections[0].rows.length, 1)
    assert.deepEqual(result.sections[0].rows[0].cells, [
      '7001',
      '',
      'https://support.it/tickets/1',
      'CP offline, quoted note',
    ])
  })

  it('allows missing optional ticket and LTE usage fields', () => {
    const csv = [
      'Priority 4,,,',
      'On LTE,,,',
      'Store:,Data Usage,Ticket:,Notes:',
      '7001,,,Missing ticket and usage',
    ].join('\n')

    const result = parseNocCsvReport(csv)

    assert.equal(result.issues.length, 1)
    assert.equal(result.warnings.length, 0)
    assert.equal(result.issues[0].ticketUrl, undefined)
    assert.equal(result.issues[0].dataUsageGb, undefined)
    assert.equal(result.issues[0].notes, 'Missing ticket and usage')
  })

  it('reports invalid priority headers and rows missing store IDs', () => {
    const csv = [
      'Priority 9,,,',
      'Unsupported,,,',
      'Priority 1,,,',
      'Business Central Offline,,,',
      'Store:,,Ticket:,Notes:',
      ',,https://support.it/tickets/2,No store',
    ].join('\n')

    const result = parseNocCsvReport(csv)

    assert.equal(result.issues.length, 0)
    assert.equal(
      result.warnings.some((warning) => warning.code === 'invalid_priority'),
      true,
    )
    assert.equal(
      result.warnings.some((warning) => warning.code === 'missing_store_id'),
      true,
    )
  })

  it('parses LTE usage strings and warns on invalid usage text', () => {
    assert.equal(parseDataUsageGb('100 GB'), 100)
    assert.equal(parseDataUsageGb('1,250.5 gb'), 1250.5)
    assert.equal(parseDataUsageGb(''), undefined)
    assert.equal(parseDataUsageGb('high'), undefined)

    const csv = [
      'Priority 4,,,',
      'On LTE,,,',
      'Store:,Data Usage,Ticket:,Notes:',
      '7001,high,https://support.it/tickets/3,Bad usage',
    ].join('\n')

    const result = parseNocCsvReport(csv)

    assert.equal(result.issues.length, 1)
    assert.equal(result.issues[0].dataUsageGb, undefined)
    assert.equal(
      result.warnings.some((warning) => warning.code === 'invalid_data_usage'),
      true,
    )
  })

  it('maps Priority 5 device codes and falls back to Unknown for unexpected values', () => {
    assert.equal(mapPriorityFiveDevice('CP').deviceType, 'Cradlepoint')
    assert.equal(mapPriorityFiveDevice('IH').deviceType, 'InHand')

    const unknown = mapPriorityFiveDevice('Firewall')

    assert.equal(unknown.deviceType, 'Unknown')
    assert.equal(unknown.warning?.code, 'unknown_device_type')
  })
})

describe('NOC issue schema', () => {
  const validIssue: NocIssue = {
    id: 'p4-7001-1',
    storeId: '7001',
    priority: 4,
    category: 'On LTE',
    deviceType: 'LTE',
    ticketUrl: 'https://support.it/tickets/3',
    notes: 'ISP down',
    dataUsageGb: 25,
    rawDataUsage: '25 GB',
    sourceSection: 'Priority 4',
  }

  it('accepts a valid normalized issue', () => {
    assert.equal(nocIssueSchema.safeParse(validIssue).success, true)
  })

  it('requires store IDs and valid ticket URLs', () => {
    assert.equal(
      nocIssueSchema.safeParse({ ...validIssue, storeId: '' }).success,
      false,
    )
    assert.equal(
      nocIssueSchema.safeParse({ ...validIssue, ticketUrl: 'not-a-url' }).success,
      false,
    )
  })

  it('rejects invalid priorities, devices, and negative usage', () => {
    assert.equal(
      nocIssueSchema.safeParse({ ...validIssue, priority: 6 }).success,
      false,
    )
    assert.equal(
      nocIssueSchema.safeParse({ ...validIssue, deviceType: 'Firewall' }).success,
      false,
    )
    assert.equal(
      nocIssueSchema.safeParse({ ...validIssue, dataUsageGb: -1 }).success,
      false,
    )
  })
})
