import type { LeaseWithRelations } from '@/types/database'

type Props = { lease: LeaseWithRelations }

export default function CamAudit({ lease }: Props) {
  const items = lease.cam_line_items

  if (items.length === 0) {
    return <div className="empty-state">No CAM line items extracted yet. Upload a lease to populate this tab.</div>
  }

  const years = Array.from(new Set(items.map(i => i.year))).sort()

  return (
    <div>
      {years.map(year => {
        const yearItems = items.filter(i => i.year === year)
        const totalBilled = yearItems.reduce((s, i) => s + (i.landlord_billed ?? 0), 0)
        const totalTenant = yearItems.reduce((s, i) => s + (i.tenant_share ?? 0), 0)
        return (
          <div key={year} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>
              {year} CAM Reconciliation
            </h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Landlord Billed</th>
                    <th>Tenant Share</th>
                    <th>Variance</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {yearItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{fmt(item.landlord_billed)}</td>
                      <td>{fmt(item.tenant_share)}</td>
                      <td style={{ color: variance(item) < 0 ? '#c62828' : '#2e7d32' }}>
                        {fmt(variance(item))}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.notes ?? '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}>
                    <td>Total</td>
                    <td>{fmt(totalBilled)}</td>
                    <td>{fmt(totalTenant)}</td>
                    <td style={{ color: totalTenant - totalBilled < 0 ? '#c62828' : '#2e7d32' }}>
                      {fmt(totalTenant - totalBilled)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function fmt(n: number | null): string {
  if (n == null) return '—'
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function variance(item: { landlord_billed: number | null; tenant_share: number | null }): number {
  return (item.tenant_share ?? 0) - (item.landlord_billed ?? 0)
}
