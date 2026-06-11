import type { LeaseWithRelations, Location } from '@/types/database'

type Props = { lease: LeaseWithRelations; location: Location }

export default function AdditionalRent({ lease }: Props) {
  const monthly = (lease.base_rent_monthly ?? 0) + (lease.cam_estimated_monthly ?? 0)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Section title="Monthly Summary">
        <Row label="Base Rent" value={fmt(lease.base_rent_monthly)} />
        <Row label="CAM Estimated" value={fmt(lease.cam_estimated_monthly)} />
        <Row label="Total Monthly" value={fmt(monthly)} bold />
        <Row label="Annual Total" value={fmt(monthly * 12)} />
      </Section>

      <Section title="Lease Basis">
        <Row label="Square Footage" value={lease.square_footage ? `${lease.square_footage.toLocaleString()} SF` : '—'} />
        <Row label="Pro-Rata Share" value={lease.pro_rata_share != null ? `${(lease.pro_rata_share * 100).toFixed(2)}%` : '—'} />
        <Row label="Term Type" value={lease.term_type ?? '—'} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gap: 1, background: 'var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '9px 14px',
      background: 'var(--surface)',
      fontSize: 'var(--text-sm)',
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

function fmt(n: number | null): string {
  const val = n ?? 0
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
