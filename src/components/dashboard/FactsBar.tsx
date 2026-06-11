'use client'

import type { LeaseWithRelations } from '@/types/database'
import styles from './FactsBar.module.css'

type Props = { lease: LeaseWithRelations }

export default function FactsBar({ lease }: Props) {
  const fmt = (n: number | null, prefix = '$') =>
    n == null ? '—' : `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const pct = (n: number | null) =>
    n == null ? '—' : `${(n * 100).toFixed(2)}%`

  const sqft = (n: number | null) =>
    n == null ? '—' : `${n.toLocaleString()} SF`

  const facts: { label: string; value: string }[] = [
    { label: 'Square Footage',  value: sqft(lease.square_footage) },
    { label: 'Base Rent / Mo',  value: fmt(lease.base_rent_monthly) },
    { label: 'CAM Est. / Mo',   value: fmt(lease.cam_estimated_monthly) },
    { label: 'Total / Mo',      value: fmt(
      lease.base_rent_monthly != null && lease.cam_estimated_monthly != null
        ? lease.base_rent_monthly + lease.cam_estimated_monthly
        : null
    )},
    { label: 'Pro-Rata Share',  value: pct(lease.pro_rata_share) },
    { label: 'Possession Date', value: fmtDate(lease.possession_date) },
    { label: 'Commencement',    value: fmtDate(lease.commencement_date) },
    { label: 'Lease Expiry',    value: fmtDate(lease.expiry_date) },
    { label: 'Term Type',       value: lease.term_type ?? '—' },
    { label: 'Status',          value: lease.status ?? '—' },
  ]

  return (
    <div className={styles.bar}>
      {facts.map(f => (
        <div key={f.label} className={styles.cell}>
          <span className={styles.label}>{f.label}</span>
          <span className={styles.value}>{f.value}</span>
        </div>
      ))}
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
