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

  const renewalDates = lease.critical_dates.filter(d =>
    d.event_type === 'renewal_deadline' || d.event_type === 'right_to_renew'
  )
  const renewalCount = renewalDates.length
  const noticeDays = renewalDates[0]?.notice_required_days ?? null

  const glaDisplay = lease.square_footage != null
    ? `${lease.square_footage.toLocaleString()} ${lease.area_unit ?? 'SF'}`
    : '--'

  const termDisplay = lease.term_length_months != null
    ? lease.term_length_months
    : termMonths

  const kpis: { label: string; value: string | null; sub?: string }[] = [
    {
      label: 'Rent Structure',
      value: lease.rent_structure ?? '--',
      sub: lease.term_type ?? 'Lease Type',
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
      value: glaDisplay,
      sub: 'Gross Leasable Area',
    },
    {
      label: 'Lease Term',
      value: termDisplay != null ? `${termDisplay} months` : '--',
      sub: termDisplay != null ? `${(termDisplay / 12).toFixed(1)} years` : undefined,
    },
    {
      label: 'Remaining',
      value: remainingMonths > 0 ? `${remainingMonths} months` : 'Expired',
      sub: remainingMonths > 0 ? `${(remainingMonths / 12).toFixed(1)} years` : undefined,
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
      label: 'Pro-Rata Share',
      value: lease.pro_rata_share != null ? `${lease.pro_rata_share.toFixed(2)}%` : 'Per Lease',
      sub: 'Of GLA',
    },
    {
      label: 'Renewal Options',
      value: renewalCount > 0 ? `${renewalCount} Option${renewalCount !== 1 ? 's' : ''}` : '--',
      sub: noticeDays != null ? `${noticeDays}-day cancellation notice` : undefined,
    },
    {
      label: 'Security Deposit',
      value: lease.security_deposit != null ? fmtMoney(lease.security_deposit) : '--',
      sub: 'Deposit Amount',
    },
    {
      label: 'Execution Date',
      value: fmtDate(lease.execution_date),
      sub: 'Date Signed',
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
