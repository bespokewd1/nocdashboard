import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { buildDashboardMetrics, lteHighUsageThresholdGb } from './dashboard-metrics'
import type { NocIssue } from './types'

describe('dashboard metrics', () => {
  it('derives executive counts from normalized issues', () => {
    const metrics = buildDashboardMetrics([
      issue({ id: 'p1-1001', storeId: '1001', priority: 1, deviceType: 'PBX' }),
      issue({ id: 'p2-1002', storeId: '1002', priority: 2, deviceType: 'InHand' }),
      issue({ id: 'p3-1002', storeId: '1002', priority: 3, deviceType: 'Cradlepoint' }),
      issue({ id: 'p4-1003', storeId: '1003', priority: 4, deviceType: 'LTE', dataUsageGb: 75 }),
      issue({ id: 'p5-1004', storeId: '1004', priority: 5, deviceType: 'InHand' }),
    ])

    assert.equal(metrics.affectedStores, 4)
    assert.equal(metrics.bcOfflineCount, 1)
    assert.equal(metrics.ihCpOfflineCount, 2)
    assert.equal(metrics.lteHighUsageCount, 1)
    assert.equal(metrics.totalAlerts, 1)
    assert.equal(metrics.totalLteUsageGb, lteHighUsageThresholdGb)
  })

  it('sorts critical offline rows by priority, context, then store', () => {
    const metrics = buildDashboardMetrics([
      issue({ id: 'p3-9', storeId: '9', priority: 3, deviceType: 'Cradlepoint' }),
      issue({ id: 'p1-20', storeId: '20', priority: 1, deviceType: 'PBX' }),
      issue({ id: 'p1-10', storeId: '10', priority: 1, deviceType: 'PBX', notes: 'Called store' }),
    ])

    assert.deepEqual(
      metrics.criticalOfflineRows.map((row) => row.id),
      ['p1-10', 'p1-20', 'p3-9'],
    )
    assert.equal(metrics.criticalOfflineRows[0].status, 'Down')
  })

  it('sorts LTE rows by usage and derives status/action', () => {
    const metrics = buildDashboardMetrics([
      issue({ id: 'p4-10', storeId: '10', priority: 4, deviceType: 'LTE', dataUsageGb: 12 }),
      issue({ id: 'p4-20', storeId: '20', priority: 4, deviceType: 'LTE', dataUsageGb: 100 }),
      issue({ id: 'p4-30', storeId: '30', priority: 4, deviceType: 'LTE' }),
    ])

    assert.deepEqual(
      metrics.lteRows.map((row) => row.id),
      ['p4-20', 'p4-10', 'p4-30'],
    )
    assert.deepEqual(
      metrics.lteRows.map((row) => [row.status, row.action]),
      [
        ['High', 'Review usage'],
        ['Monitor', 'Monitor'],
        ['Unknown', 'Verify data'],
      ],
    )
    assert.equal(metrics.lteRows[0].usagePercent, 133)
  })

  it('splits Priority 5 alerts by device type', () => {
    const metrics = buildDashboardMetrics([
      issue({ id: 'p5-1', storeId: '1', priority: 5, deviceType: 'InHand' }),
      issue({ id: 'p5-2', storeId: '2', priority: 5, deviceType: 'InHand' }),
      issue({ id: 'p5-3', storeId: '3', priority: 5, deviceType: 'Cradlepoint' }),
      issue({ id: 'p4-4', storeId: '4', priority: 4, deviceType: 'LTE' }),
    ])

    assert.deepEqual(
      metrics.alertSplitRows.map((row) => [row.deviceType, row.count, row.percent]),
      [
        ['InHand', 2, 67],
        ['Cradlepoint', 1, 33],
      ],
    )
  })
})

function issue(overrides: Partial<NocIssue>): NocIssue {
  return {
    id: overrides.id ?? 'issue-1',
    storeId: overrides.storeId ?? '1001',
    priority: overrides.priority ?? 1,
    category: overrides.category ?? `Priority ${overrides.priority ?? 1}`,
    deviceType: overrides.deviceType ?? 'PBX',
    ticketUrl: overrides.ticketUrl,
    notes: overrides.notes,
    dataUsageGb: overrides.dataUsageGb,
    rawDataUsage: overrides.rawDataUsage,
    sourceSection: overrides.sourceSection,
  }
}
