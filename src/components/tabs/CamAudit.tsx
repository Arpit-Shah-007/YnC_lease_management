import type { LeaseWithRelations } from '@/types/database'
import { findClause, parseListItems, computeCamCapPct, computeCapRows, computeAuditTerms } from '@/lib/camAudit'
import CamYearDocuments from './CamYearDocuments'
import styles from './CamAudit.module.css'

type Props = { lease: LeaseWithRelations; isAdmin: boolean }

function fmtDollars(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CamAudit({ lease, isAdmin }: Props) {
  const { clauses, rent_schedule, cam_line_items } = lease

  const capPct = computeCamCapPct(clauses)
  const capRows = computeCapRows(rent_schedule, cam_line_items, capPct)

  // Permitted and excluded items from clauses
  const permittedClause = findClause(clauses,
    'cam_permitted', 'permitted in cam', 'cam inclusions', 'cam inclusion')
  const excludedClause = findClause(clauses,
    'cam_excluded', 'excluded from cam', 'cam exclusions', 'cam exclusion', 'cam_exclusion')

  const permittedItems = permittedClause ? parseListItems(permittedClause.content) : []
  const excludedItems  = excludedClause  ? parseListItems(excludedClause.content)  : []

  const auditTerms = computeAuditTerms(clauses)

  const hasData = capRows.length > 0

  return (
    <div className={styles.root}>
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
                      {capRows.map(({ row, annual, cap, billed, variance }, i) => (
                        <tr key={i}>
                          <td className={styles.periodCell}>
                            {row.period_label ?? '—'}
                          </td>
                          <td>{annual != null ? fmtDollars(annual) : '—'}</td>
                          <td className={styles.capCell}>
                            {cap != null ? fmtDollars(cap) : '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {billed != null ? fmtDollars(billed) : '—'}
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
                      ))}
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

      <CamYearDocuments lease={lease} isAdmin={isAdmin} />
    </div>
  )
}
