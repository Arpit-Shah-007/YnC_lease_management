import type { LeaseWithRelations } from '@/types/database'

type Props = { lease: LeaseWithRelations }

export default function RentSchedule({ lease }: Props) {
  const rows = [...lease.rent_schedule].sort((a, b) => a.sort_order - b.sort_order)

  if (rows.length === 0) {
    return <div className="empty-state">No rent schedule extracted yet.</div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Start</th>
            <th>End</th>
            <th>Base Rent / Mo</th>
            <th>Base Rent / Yr</th>
            <th>CAM Est. / Mo</th>
            <th>Total / Mo</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.period_label ?? '—'}</td>
              <td>{fmtDate(r.period_start)}</td>
              <td>{fmtDate(r.period_end)}</td>
              <td>{fmt(r.base_rent_monthly)}</td>
              <td>{fmt(r.base_rent_annual)}</td>
              <td>{fmt(r.cam_estimated_monthly)}</td>
              <td style={{ fontWeight: 600 }}>{fmt(r.total_monthly)}</td>
              <td style={{ color: 'var(--text-muted)' }}>{r.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fmt(n: number | null): string {
  return n == null ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
