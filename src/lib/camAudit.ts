import type {
  Clause,
  RentScheduleEntry,
  CamLineItem,
  CamDocument,
  CamVerdict,
  CamYearVerdict,
  LeaseWithRelations,
} from '@/types/database'

export const DEFAULT_CAM_CAP_PCT = 10

export const KEY_TERM_DEFS = [
  { label: 'PRO-RATA BASIS', terms: ['pro_rata', 'pro rata', 'proration', 'pro-rata basis'] },
  { label: 'CAM CAP',        terms: ['cam_cap', 'cam cap', 'expense cap', 'operating expense cap'] },
  { label: 'ADMIN FEE',      terms: ['admin_fee', 'admin fee', 'management fee'] },
  { label: 'RECONCILIATION', terms: ['reconciliation', 'reconcile', 'true-up', 'cam reconciliation'] },
  { label: 'ESTIMATES',      terms: ['estimates', 'estimate', 'monthly estimate'] },
  { label: 'AUDIT RIGHT',    terms: ['audit_right', 'audit right', 'audit', 'contest'] },
  { label: 'DOCUMENTATION',  terms: ['documentation', 'records', 'supporting documents'] },
  { label: 'TENANT PARCEL',  terms: ['tenant_parcel', 'tenant parcel', 'self-maintained', 'self-maintenance'] },
]

export function findClause(clauses: Clause[], ...terms: string[]): Clause | null {
  const kws = terms.map(t => t.toLowerCase())
  return clauses.find(c => {
    const hay = (c.clause_type + ' ' + c.title).toLowerCase()
    return kws.some(k => hay.includes(k))
  }) ?? null
}

export function parseNumber(text: string, re: RegExp): number | null {
  const m = text.match(re)
  return m ? parseFloat(m[1]) : null
}

export function parseListItems(content: string): string[] {
  return content
    .split(/\n|;\s*/)
    .map(s => s.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean)
}

export function computeCamCapPct(clauses: Clause[]): number {
  const camCapClause = findClause(clauses, 'cam_cap', 'cam cap', 'expense cap')
  return camCapClause
    ? (parseNumber(camCapClause.title + ' ' + camCapClause.content, /(\d+(?:\.\d+)?)\s*%/) ?? DEFAULT_CAM_CAP_PCT)
    : DEFAULT_CAM_CAP_PCT
}

export type CapRow = { row: RentScheduleEntry; annual: number | null; cap: number | null; billed: number | null; variance: number | null }

export function computeCapRows(
  rentSchedule: RentScheduleEntry[],
  camLineItems: CamLineItem[],
  capPct: number
): CapRow[] {
  return rentSchedule.map(row => {
    const annual = row.base_rent_annual
      ?? (row.base_rent_monthly != null ? row.base_rent_monthly * 12 : null)
    const cap = annual != null ? annual * capPct / 100 : null

    const yearBilled = camLineItems
      .filter(c => {
        if (!row.period_start || !row.period_end) return false
        const yr = new Date(row.period_start).getFullYear()
        const yrEnd = new Date(row.period_end).getFullYear()
        return c.year >= yr && c.year <= yrEnd
      })
      .reduce((sum, c) => sum + (c.tenant_share ?? 0), 0)

    const hasBilled = yearBilled > 0
    const variance = hasBilled && cap != null ? yearBilled - cap : null

    return { row, annual, cap, billed: hasBilled ? yearBilled : null, variance }
  })
}

export function computeAuditTerms(clauses: Clause[]) {
  return KEY_TERM_DEFS.map(def => ({
    label: def.label,
    clause: findClause(clauses, ...def.terms),
  }))
}

/** Turns a clause_type slug such as 'cam_excluded' into 'CAM Excluded' for display. */
export function humanizeClauseType(type: string): string {
  const words = type.replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'Other'
  return words
    .map(w => (w.toLowerCase() === 'cam' ? 'CAM' : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
}

// ── CAM audit summary ──────────────────────────────────────────────
//
// One row per CAM year, merging what was uploaded, what the AI audit concluded, and the
// cap derived from the rent schedule. This is what the CAM tab and the PDF summarise.

export type CamYearRow = {
  year: number
  verdict: CamVerdict | null
  estimateTotal: number | null
  actualTotal: number | null
  capAmount: number | null
  /** Amount billed above the cap. Null when either figure is unknown, 0 when within cap. */
  overage: number | null
  /** actual - estimate. Positive means the year came in over budget. */
  estimateVariance: number | null
  explanation: string
  flaggedItems: string[]
  categories: CamLineItem[]
  hasEstimate: boolean
  hasReconciliation: boolean
  computedAt: string | null
}

export type CamSummary = {
  capPct: number
  rows: CamYearRow[]
  /** Years with a computed verdict. */
  analyzedCount: number
  /** Years whose billed total exceeded the cap. */
  overCapCount: number
  /** Total billed above cap across all years — the recovery exposure. */
  totalOverage: number
  totalBilled: number | null
  totalCap: number | null
  flaggedCount: number
  /** Years that have a reconciliation on file but no verdict yet. */
  pendingYears: number[]
  /** Years where only an estimate has been uploaded, so nothing can be audited. */
  awaitingReconciliation: number[]
}

function sumOrNull(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null)
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null
}

export function buildCamSummary(lease: LeaseWithRelations): CamSummary {
  const capPct = computeCamCapPct(lease.clauses)
  const documents: CamDocument[] = lease.cam_documents ?? []
  const verdicts: CamYearVerdict[] = lease.cam_year_verdicts ?? []
  const lineItems: CamLineItem[] = lease.cam_line_items ?? []

  const years = Array.from(new Set([
    ...documents.map(d => d.year),
    ...verdicts.map(v => v.year),
    ...lineItems.map(i => i.year),
  ])).sort((a, b) => b - a)

  const rows: CamYearRow[] = years.map(year => {
    const verdict = verdicts.find(v => v.year === year) ?? null
    const hasEstimate = documents.some(d => d.year === year && d.doc_type === 'estimate')
    const hasReconciliation = documents.some(d => d.year === year && d.doc_type === 'reconciliation')
    const categories = lineItems.filter(i => i.year === year)

    // Prefer the audited total; fall back to the line items when only those exist.
    const actualTotal = verdict?.actual_total
      ?? sumOrNull(categories.map(c => c.tenant_share))

    const capAmount = verdict?.cap_amount ?? (() => {
      const annual = findAnnualRentForYear(lease.rent_schedule, year)
      return annual != null ? annual * capPct / 100 : null
    })()

    const overage = actualTotal != null && capAmount != null
      ? Math.max(0, actualTotal - capAmount)
      : null

    const estimateVariance = actualTotal != null && verdict?.estimate_total != null
      ? actualTotal - verdict.estimate_total
      : null

    return {
      year,
      verdict: verdict?.verdict ?? null,
      estimateTotal: verdict?.estimate_total ?? null,
      actualTotal,
      capAmount,
      overage,
      estimateVariance,
      explanation: verdict?.explanation ?? '',
      flaggedItems: verdict?.flagged_items ?? [],
      categories,
      hasEstimate,
      hasReconciliation,
      computedAt: verdict?.computed_at ?? null,
    }
  })

  return {
    capPct,
    rows,
    analyzedCount: rows.filter(r => r.verdict != null).length,
    overCapCount: rows.filter(r => r.overage != null && r.overage > 0).length,
    totalOverage: rows.reduce((sum, r) => sum + (r.overage ?? 0), 0),
    totalBilled: sumOrNull(rows.map(r => r.actualTotal)),
    totalCap: sumOrNull(rows.map(r => r.capAmount)),
    flaggedCount: rows.reduce((sum, r) => sum + r.flaggedItems.length, 0),
    pendingYears: rows.filter(r => r.hasReconciliation && r.verdict == null).map(r => r.year),
    awaitingReconciliation: rows.filter(r => r.hasEstimate && !r.hasReconciliation).map(r => r.year),
  }
}

// Finds the rent-schedule period overlapping a given calendar year and returns its annual
// rent, for computing a CAM cap dollar amount tied to a specific year (used by the CAM
// estimate/reconciliation comparison, which is year-based, unlike the period-based cap table).
export function findAnnualRentForYear(rentSchedule: RentScheduleEntry[], year: number): number | null {
  const yearStart = new Date(Date.UTC(year, 0, 1))
  const yearEnd = new Date(Date.UTC(year, 11, 31))

  const row = rentSchedule.find(r => {
    if (!r.period_start || !r.period_end) return false
    return new Date(r.period_start) <= yearEnd && new Date(r.period_end) >= yearStart
  })
  if (!row) return null

  return row.base_rent_annual ?? (row.base_rent_monthly != null ? row.base_rent_monthly * 12 : null)
}
