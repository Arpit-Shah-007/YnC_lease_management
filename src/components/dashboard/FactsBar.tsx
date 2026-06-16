'use client'

import type { LeaseWithRelations, Clause } from '@/types/database'
import styles from './FactsBar.module.css'

type Props = { lease: LeaseWithRelations }

function findClause(clauses: Clause[], ...terms: string[]): Clause | null {
  const kws = terms.map(t => t.toLowerCase())
  return clauses.find(c => {
    const t = (c.clause_type + ' ' + c.title).toLowerCase()
    return kws.some(k => t.includes(k))
  }) ?? null
}

function parseNumber(text: string, re: RegExp): number | null {
  const m = text.match(re)
  return m ? parseFloat(m[1]) : null
}

export default function FactsBar({ lease }: Props) {
  const { clauses, rent_schedule, pro_rata_share, square_footage } = lease

  // 1 — CAM Cap: cap pct from clause, amount from current rent-schedule period
  const camCapClause = findClause(clauses, 'cam_cap', 'cam cap', 'expense cap', 'operating expense cap')
  const capPct = camCapClause
    ? (parseNumber(camCapClause.title + ' ' + camCapClause.content, /(\d+(?:\.\d+)?)\s*%/) ?? 10)
    : 10

  const today = new Date()
  const currentPeriod = rent_schedule.find(r => {
    if (!r.period_start || !r.period_end) return false
    return new Date(r.period_start) <= today && new Date(r.period_end) >= today
  }) ?? (rent_schedule.length > 0 ? rent_schedule[rent_schedule.length - 1] : null)

  const annualRent = currentPeriod?.base_rent_annual
    ?? (currentPeriod?.base_rent_monthly != null ? currentPeriod.base_rent_monthly * 12 : null)
  const camCapAmount = annualRent != null ? annualRent * capPct / 100 : null

  const camCapDesc = camCapClause?.content
    ? camCapClause.content.split('.').slice(0, 2).join('.') + '.'
    : `Hard ceiling = ${capPct}% of annual Fixed Rent${annualRent != null ? ` (${fmtDollars(annualRent)})` : ''}. CAM billed above this is recoverable.`

  // 2 — Pro-Rata Basis
  const isPending = pro_rata_share == null
  const proRataDesc = square_footage != null
    ? `${square_footage.toLocaleString()} SF ÷ total Shopping Center SF (needs landlord confirm / lease exhibit).`
    : 'Premises SF ÷ total Shopping Center SF — pending landlord confirmation.'

  // 3 — Admin Fee
  const adminFeeClause = findClause(clauses, 'admin_fee', 'admin fee', 'management fee')
  const adminFeePct = adminFeeClause
    ? parseNumber(adminFeeClause.title + ' ' + adminFeeClause.content, /(\d+(?:\.\d+)?)\s*%/)
    : null
  const adminFeeDesc = adminFeeClause?.content
    ? adminFeeClause.content.split('.').slice(0, 2).join('.') + '.'
    : 'On common-area costs. Check clause for mgmt/admin wage exclusions.'

  // 4 — Contest Window
  const auditClause = findClause(clauses, 'audit_right', 'audit right', 'contest window', 'contest', 'dispute')
  const contestDays = auditClause
    ? parseNumber(auditClause.title + ' ' + auditClause.content, /(\d+)\s*days?/)
    : null
  const contestDesc = auditClause?.content
    ? auditClause.content.split('.').slice(0, 2).join('.') + '.'
    : 'To contest a CAM statement after receipt, then waived.'

  return (
    <div className={styles.strip}>
      {/* 1 — CAM Cap */}
      <div className={styles.kpi}>
        <div className={styles.value}>
          {camCapAmount != null ? fmtDollars(camCapAmount) : '—'}
        </div>
        <div className={styles.desc}>{camCapDesc}</div>
      </div>

      {/* 2 — Pro-Rata Basis */}
      <div className={styles.kpi}>
        <div className={styles.value}>
          {isPending ? (
            <>
              <span className={styles.dash}>—</span>
              <span className={styles.pendingPill}>PENDING</span>
            </>
          ) : (
            `${((pro_rata_share ?? 0) * 100).toFixed(2)}%`
          )}
        </div>
        <div className={styles.desc}>{proRataDesc}</div>
      </div>

      {/* 3 — Admin Fee */}
      <div className={styles.kpi}>
        <div className={styles.value}>
          {adminFeePct != null ? `${adminFeePct}%` : '—'}
        </div>
        <div className={styles.desc}>{adminFeeDesc}</div>
      </div>

      {/* 4 — Contest Window */}
      <div className={styles.kpi}>
        <div className={styles.value}>
          {contestDays != null ? `${contestDays} days` : '—'}
        </div>
        <div className={styles.desc}>{contestDesc}</div>
      </div>
    </div>
  )
}

function fmtDollars(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
