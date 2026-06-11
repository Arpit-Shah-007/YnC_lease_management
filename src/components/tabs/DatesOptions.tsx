import type { LeaseWithRelations } from '@/types/database'

type Props = { lease: LeaseWithRelations }

export default function DatesOptions({ lease }: Props) {
  const dates = lease.critical_dates

  if (dates.length === 0) {
    return <div className="empty-state">No critical dates extracted yet.</div>
  }

  const sorted = [...dates].sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  })

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Notice Required</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(d => (
            <tr key={d.id}>
              <td style={{ fontWeight: 500 }}>{d.event_type}</td>
              <td>{fmtDate(d.event_date)}</td>
              <td>{d.notice_required_days != null ? `${d.notice_required_days} days` : '—'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{d.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
