import type { Clause, RentScheduleEntry, CamLineItem } from '@/types/database'

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
