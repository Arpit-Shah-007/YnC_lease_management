import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildCamSummary, humanizeClauseType } from '@/lib/camAudit'
import type { CamDocument, CamLineItem, CamYearVerdict } from '@/types/database'
import { camLineItem, clause, lease, rentPeriod } from './fixtures'

function camDoc(over: Partial<CamDocument> = {}): CamDocument {
  return {
    id: 'doc-1',
    year: 2020,
    doc_type: 'reconciliation',
    file_name: 'recon.pdf',
    storage_bucket: 'leases',
    storage_path: 'cam/lease-1/recon.pdf',
    file_size_bytes: 1234,
    uploaded_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

function verdict(over: Partial<CamYearVerdict> = {}): CamYearVerdict {
  return {
    year: 2020,
    verdict: 'ok',
    actual_total: 1000,
    estimate_total: 900,
    cap_amount: 1200,
    explanation: 'Within cap.',
    flagged_items: [],
    computed_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

describe('humanizeClauseType', () => {
  it('turns slugs into title case', () => {
    assert.equal(humanizeClauseType('audit_right'), 'Audit Right')
    assert.equal(humanizeClauseType('security-deposit'), 'Security Deposit')
  })

  it('keeps CAM as an acronym', () => {
    assert.equal(humanizeClauseType('cam_cap'), 'CAM Cap')
    assert.equal(humanizeClauseType('cam_excluded'), 'CAM Excluded')
  })

  it('normalises existing capitalisation', () => {
    assert.equal(humanizeClauseType('AUDIT_RIGHT'), 'Audit Right')
  })

  it('falls back to Other for an empty type', () => {
    assert.equal(humanizeClauseType(''), 'Other')
    assert.equal(humanizeClauseType('___'), 'Other')
  })
})

describe('buildCamSummary', () => {
  it('returns an empty summary when there is no CAM data at all', () => {
    const s = buildCamSummary(lease())
    assert.deepEqual(s.rows, [])
    assert.equal(s.analyzedCount, 0)
    assert.equal(s.overCapCount, 0)
    assert.equal(s.totalOverage, 0)
    assert.equal(s.totalBilled, null)
    assert.equal(s.flaggedCount, 0)
  })

  it('defaults the cap percentage to 10 with no cap clause', () => {
    assert.equal(buildCamSummary(lease()).capPct, 10)
  })

  it('reads the cap percentage off the lease clauses', () => {
    const s = buildCamSummary(lease({
      clauses: [clause({ clause_type: 'cam_cap', title: 'CAM Cap', content: 'capped at 6% per year' })],
    }))
    assert.equal(s.capPct, 6)
  })

  it('lists years newest first', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc({ id: 'a', year: 2019 }), camDoc({ id: 'b', year: 2021 }), camDoc({ id: 'c', year: 2020 })],
    }))
    assert.deepEqual(s.rows.map(r => r.year), [2021, 2020, 2019])
  })

  it('computes the overage when billing exceeds the cap', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ verdict: 'high', actual_total: 1500, cap_amount: 1200 })],
    }))
    assert.equal(s.rows[0].overage, 300)
    assert.equal(s.totalOverage, 300)
    assert.equal(s.overCapCount, 1)
  })

  it('reports zero overage rather than a negative when within cap', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ actual_total: 800, cap_amount: 1200 })],
    }))
    assert.equal(s.rows[0].overage, 0)
    assert.equal(s.totalOverage, 0)
    assert.equal(s.overCapCount, 0)
  })

  it('leaves overage null when the cap is unknown', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ actual_total: 800, cap_amount: null })],
    }))
    assert.equal(s.rows[0].overage, null)
    assert.equal(s.totalOverage, 0)
  })

  it('computes the estimate variance only when an estimate exists', () => {
    const withEstimate = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ actual_total: 1000, estimate_total: 900 })],
    }))
    assert.equal(withEstimate.rows[0].estimateVariance, 100)

    const withoutEstimate = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ actual_total: 1000, estimate_total: null })],
    }))
    assert.equal(withoutEstimate.rows[0].estimateVariance, null)
  })

  it('derives the cap from the rent schedule when the verdict has none', () => {
    const s = buildCamSummary(lease({
      rent_schedule: [rentPeriod({ period_start: '2020-01-01', period_end: '2020-12-31', base_rent_annual: 24000 })],
      cam_line_items: [camLineItem({ year: 2020, tenant_share: 500 })],
    }))
    // 10% default cap of 24,000
    assert.equal(s.rows[0].capAmount, 2400)
  })

  it('falls back to summing line items when no verdict total exists', () => {
    const items: CamLineItem[] = [
      camLineItem({ id: 'a', year: 2020, tenant_share: 300 }),
      camLineItem({ id: 'b', year: 2020, tenant_share: 250 }),
    ]
    const s = buildCamSummary(lease({ cam_line_items: items }))
    assert.equal(s.rows[0].actualTotal, 550)
  })

  it('prefers the audited total over the line-item sum', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc()],
      cam_year_verdicts: [verdict({ actual_total: 999 })],
      cam_line_items: [camLineItem({ year: 2020, tenant_share: 111 })],
    }))
    assert.equal(s.rows[0].actualTotal, 999)
  })

  it('attaches each year its own categories', () => {
    const s = buildCamSummary(lease({
      cam_line_items: [
        camLineItem({ id: 'a', year: 2020, category: 'Landscaping', tenant_share: 100 }),
        camLineItem({ id: 'b', year: 2021, category: 'Snow', tenant_share: 200 }),
      ],
    }))
    const y2020 = s.rows.find(r => r.year === 2020)
    assert.equal(y2020?.categories.length, 1)
    assert.equal(y2020?.categories[0].category, 'Landscaping')
  })

  it('totals overage and flagged items across years', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc({ id: 'a', year: 2020 }), camDoc({ id: 'b', year: 2021 })],
      cam_year_verdicts: [
        verdict({ year: 2020, verdict: 'high', actual_total: 1500, cap_amount: 1200, flagged_items: ['Capital repairs'] }),
        verdict({ year: 2021, verdict: 'high', actual_total: 2000, cap_amount: 1300, flagged_items: ['Roof', 'Legal fees'] }),
      ],
    }))
    assert.equal(s.totalOverage, 300 + 700)
    assert.equal(s.overCapCount, 2)
    assert.equal(s.flaggedCount, 3)
    assert.equal(s.analyzedCount, 2)
    assert.equal(s.totalBilled, 3500)
    assert.equal(s.totalCap, 2500)
  })

  it('flags a year with a reconciliation but no verdict as pending', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc({ year: 2020, doc_type: 'reconciliation' })],
    }))
    assert.deepEqual(s.pendingYears, [2020])
    assert.deepEqual(s.awaitingReconciliation, [])
    assert.equal(s.analyzedCount, 0)
  })

  it('flags an estimate-only year as awaiting its reconciliation', () => {
    const s = buildCamSummary(lease({
      cam_documents: [camDoc({ year: 2020, doc_type: 'estimate' })],
    }))
    assert.deepEqual(s.awaitingReconciliation, [2020])
    assert.deepEqual(s.pendingYears, [])
  })

  it('treats an audited year as neither pending nor awaiting', () => {
    const s = buildCamSummary(lease({
      cam_documents: [
        camDoc({ id: 'e', year: 2020, doc_type: 'estimate' }),
        camDoc({ id: 'r', year: 2020, doc_type: 'reconciliation' }),
      ],
      cam_year_verdicts: [verdict({ year: 2020 })],
    }))
    assert.deepEqual(s.pendingYears, [])
    assert.deepEqual(s.awaitingReconciliation, [])
    assert.equal(s.rows[0].hasEstimate, true)
    assert.equal(s.rows[0].hasReconciliation, true)
  })
})
