import type { LeaseWithRelations } from '@/types/database'
import styles from './LeaseKPITable.module.css'

type Props = { lease: LeaseWithRelations }

export default function LeaseKPITable({ lease }: Props) {
  const now = new Date()
  const expiry = lease.expiry_date ? new Date(lease.expiry_date) : null
  const commence = lease.commencement_date ? new Date(lease.commencement_date) : null

  const termMonths = expiry && commence
    ? Math.round((expiry.getTime() - commence.getTime()) / (1000 * 60 * 60 * 24 * 30.437))
    : null

  const remainingMonths = expiry && expiry > now
    ? Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.437))
    : 0

  const currentPeriod = lease.rent_schedule.find(r => {
    if (!r.period_start || !r.period_end) return false
    const s = new Date(r.period_start)
    const e = new Date(r.period_end)
    return now >= s && now <= e
  }) ?? lease.rent_schedule[0] ?? null

  const currentMonthly = currentPeriod?.base_rent_monthly ?? lease.base_rent_monthly
  const currentAnnual = currentPeriod?.base_rent_annual ?? (currentMonthly != null ? currentMonthly * 12 : null)

  const renewalCount = lease.critical_dates.filter(d => d.event_type === 'renewal_deadline').length

  const kpis: { label: string; value: string | null; sub?: string }[] = [
    {
      label: 'Rent Structure',
      value: lease.term_type ?? '--',
      sub: 'Lease Type',
    },
    {
      label: 'Monthly Rent',
      value: currentMonthly != null ? fmtMoney(currentMonthly) : '--',
      sub: 'Current Period',
    },
    {
      label: 'Annual Rent',
      value: currentAnnual != null ? fmtMoney(currentAnnual) : '--',
      sub: 'Current Period',
    },
    {
      label: 'GLA',
      value: lease.square_footage != null ? lease.square_footage.toLocaleString() + ' SF' : '--',
      sub: 'Gross Leasable Area',
    },
    {
      label: 'Lease Term',
      value: termMonths != null ? `${termMonths} months` : '--',
      sub: termMonths != null ? `${(termMonths / 12).toFixed(1)} years` : undefined,
    },
    {
      label: 'Commencement',
      value: fmtDate(lease.commencement_date),
      sub: 'Lease Start',
    },
    {
      label: 'Expiry',
      value: fmtDate(lease.expiry_date),
      sub: 'Primary Term End',
    },
    {
      label: 'Remaining',
      value: remainingMonths > 0 ? `${remainingMonths} months` : 'Expired',
      sub: remainingMonths > 0 ? `${(remainingMonths / 12).toFixed(1)} years` : undefined,
    },
    {
      label: 'Renewal Options',
      value: renewalCount > 0 ? `${renewalCount} × 5-Year Auto` : '--',
      sub: renewalCount > 0 ? '1-year cancellation notice' : undefined,
    },
    {
      label: 'Pro-Rata Share',
      value: lease.pro_rata_share != null ? `${lease.pro_rata_share.toFixed(2)}%` : 'Per Lease',
      sub: 'Of GLA',
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {kpis.map(kpi => (
          <div key={kpi.label} className={styles.cell}>
            <div className={styles.cellLabel}>{kpi.label}</div>
            <div className={styles.cellValue}>{kpi.value}</div>
            {kpi.sub && <div className={styles.cellSub}>{kpi.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
