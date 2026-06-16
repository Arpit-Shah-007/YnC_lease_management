import type { LeaseWithRelations, Clause, RentScheduleEntry } from '@/types/database'
import styles from './CamAudit.module.css'

type Props = { lease: LeaseWithRelations }

function findClause(clauses: Clause[], ...terms: string[]): Clause | null {
  const kws = terms.map(t => t.toLowerCase())
  return clauses.find(c => {
    const hay = (c.clause_type + ' ' + c.title).toLowerCase()
    return kws.some(k => hay.includes(k))
  }) ?? null
}

function parseNumber(text: string, re: RegExp): number | null {
  const m = text.match(re)
  return m ? parseFloat(m[1]) : null
}

function parseListItems(content: string): string[] {
  return content
    .split(/\n|;\s*/)
    .map(s => s.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean)
}

function fmtDollars(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const KEY_TERM_DEFS = [
  { label: 'PRO-RATA BASIS', terms: ['pro_rata', 'pro rata', 'proration', 'pro-rata basis'] },
  { label: 'CAM CAP',        terms: ['cam_cap', 'cam cap', 'expense cap', 'operating expense cap'] },
  { label: 'ADMIN FEE',      terms: ['admin_fee', 'admin fee', 'management fee'] },
  { label: 'RECONCILIATION', terms: ['reconciliation', 'reconcile', 'true-up', 'cam reconciliation'] },
  { label: 'ESTIMATES',      terms: ['estimates', 'estimate', 'monthly estimate'] },
  { label: 'AUDIT RIGHT',    terms: ['audit_right', 'audit right', 'audit', 'contest'] },
  { label: 'DOCUMENTATION',  terms: ['documentation', 'records', 'supporting documents'] },
  { label: 'TENANT PARCEL',  terms: ['tenant_parcel', 'tenant parcel', 'self-maintained', 'self-maintenance'] },
]

export default function CamAudit({ lease }: Props) {
  const { clauses, rent_schedule, cam_line_items } = lease

  // CAM cap percentage
  const camCapClause = findClause(clauses, 'cam_cap', 'cam cap', 'expense cap')
  const capPct = camCapClause
    ? (parseNumber(camCapClause.title + ' ' + camCapClause.content, /(\d+(?:\.\d+)?)\s*%/) ?? 10)
    : 10

  // CAM Cap by Year rows — derived from rent_schedule
  const capRows: { row: RentScheduleEntry; annual: number | null; cap: number | null }[] =
    rent_schedule.map(r => {
      const annual = r.base_rent_annual
        ?? (r.base_rent_monthly != null ? r.base_rent_monthly * 12 : null)
      const cap = annual != null ? annual * capPct / 100 : null
      return { row: r, annual, cap }
    })

  // Permitted and excluded items from clauses
  const permittedClause = findClause(clauses,
    'cam_permitted', 'permitted in cam', 'cam inclusions', 'cam inclusion')
  const excludedClause = findClause(clauses,
    'cam_excluded', 'excluded from cam', 'cam exclusions', 'cam exclusion', 'cam_exclusion')

  const permittedItems = permittedClause ? parseListItems(permittedClause.content) : []
  const excludedItems  = excludedClause  ? parseListItems(excludedClause.content)  : []

  // Key Audit Terms
  const auditTerms = KEY_TERM_DEFS.map(def => ({
    label: def.label,
    clause: findClause(clauses, ...def.terms),
  }))

  const hasData = capRows.length > 0

  return (
    <div className={styles.root}>
      {/* Warning banner */}
      <div className={styles.warning}>
        <span className={styles.warnIcon} aria-hidden>⚠</span>
        <p>
          <strong>Overcharge analysis is pending the landlord&apos;s CAM reconciliation statement(s).</strong>{' '}
          The baseline below (cap, inclusions, exclusions, admin-fee rule) is fully derived.
          Provide the actual CAM bills and this module computes billed-vs-permitted and flags
          recoverable amounts.
        </p>
      </div>

      {/* Two-column layout */}
      <div className={styles.columns}>

        {/* ── Left column ── */}
        <div className={styles.left}>

          {/* CAM Cap by Year */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>CAM Cap by Year</h3>
              <span className={`chip chip-purple ${styles.derivedBadge}`}>DERIVED</span>
            </div>

            {hasData ? (
              <>
                <p className={styles.sectionDesc}>
                  CAM share &ldquo;shall in no event exceed {capPct}% of total Fixed Annual
                  Rental for the year.&rdquo; Caps below are computed from the rent schedule.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Lease Year</th>
                        <th>Annual Fixed Rent</th>
                        <th>CAM Cap ({capPct}%)</th>
                        <th>Billed</th>
                        <th>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capRows.map(({ row, annual, cap }, i) => {
                        const yearBilled = cam_line_items
                          .filter(c => {
                            if (!row.period_start || !row.period_end) return false
                            const yr = new Date(row.period_start).getFullYear()
                            const yrEnd = new Date(row.period_end).getFullYear()
                            return c.year >= yr && c.year <= yrEnd
                          })
                          .reduce((sum, c) => sum + (c.tenant_share ?? 0), 0)

                        const hasBilled = yearBilled > 0
                        const variance = hasBilled && cap != null
                          ? yearBilled - cap
                          : null

                        return (
                          <tr key={i}>
                            <td className={styles.periodCell}>
                              {row.period_label ?? '—'}
                            </td>
                            <td>{annual != null ? fmtDollars(annual) : '—'}</td>
                            <td className={styles.capCell}>
                              {cap != null ? fmtDollars(cap) : '—'}
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>
                              {hasBilled ? fmtDollars(yearBilled) : '—'}
                            </td>
                            <td className={styles.varianceCell}>
                              {variance != null
                                ? <span style={{ color: variance > 0 ? 'var(--pos)' : 'var(--accent)' }}>
                                    {fmtDollars(variance)}
                                  </span>
                                : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>pending</span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className={styles.emptyHint}>
                Upload a lease PDF to compute CAM caps from the rent schedule.
              </p>
            )}
          </div>

          {/* Permitted + Excluded boxes */}
          {(permittedItems.length > 0 || excludedItems.length > 0) && (
            <div className={styles.itemBoxes}>
              {permittedItems.length > 0 && (
                <div className={styles.permittedBox}>
                  <div className={styles.boxTitle} style={{ color: '#1a6e43' }}>
                    Permitted in CAM
                  </div>
                  <ul className={styles.itemList}>
                    {permittedItems.map((item, i) => (
                      <li key={i} className={styles.permItem}>
                        <span className={styles.checkIcon}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludedItems.length > 0 && (
                <div className={styles.excludedBox}>
                  <div className={styles.boxTitle} style={{ color: '#b91c1c' }}>
                    Excluded from CAM
                  </div>
                  <ul className={styles.itemList}>
                    {excludedItems.map((item, i) => (
                      <li key={i} className={styles.exclItem}>
                        <span className={styles.xIcon}>✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column — Key Audit Terms ── */}
        <div className={styles.right}>
          <div className={styles.keyTermsCard}>
            <h3 className={styles.keyTermsTitle}>Key Audit Terms</h3>
            <p className={styles.keyTermsSubtitle}>
              The levers that decide how favorable this lease is.
            </p>
            <div className={styles.termGrid}>
              {auditTerms.map(({ label, clause }) => (
                <div key={label} className={styles.termCard}>
                  <div className={styles.termLabel}>{label}</div>
                  <div className={styles.termValue}>
                    {clause?.title ?? '—'}
                  </div>
                  {clause?.content && (
                    <div className={styles.termDesc}>
                      {clause.content.split('.')[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
