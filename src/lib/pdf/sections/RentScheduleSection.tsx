import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { fmtMoney, fmtDate } from '@/lib/format'
import { pdfStyles } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'
import { TableHeaderRow } from '../TableHeaderRow'

const COLS = [
  { key: 'period', label: 'Period', width: '15%' },
  { key: 'start', label: 'Start', width: '11%' },
  { key: 'end', label: 'End', width: '11%' },
  { key: 'baseMo', label: 'Base/Mo', width: '13%' },
  { key: 'camMo', label: 'CAM/Mo', width: '12%' },
  { key: 'totalMo', label: 'Total/Mo', width: '13%' },
  { key: 'notes', label: 'Notes', width: '25%' },
] as const

type Props = { lease: LeaseWithRelations; accentColor: string }

export function RentScheduleSection({ lease, accentColor }: Props) {
  const rows = [...lease.rent_schedule].sort((a, b) => a.sort_order - b.sort_order)
  if (rows.length === 0) return null

  return (
    <View>
      <SectionHeader title="Rent Schedule" color={accentColor} />
      <View style={pdfStyles.table}>
        <TableHeaderRow columns={COLS} />
        {rows.map((r, i) => (
          <View key={r.id} wrap={false} style={i === rows.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
            <Text style={[pdfStyles.td, { width: COLS[0].width }]}>{r.period_label ?? '—'}</Text>
            <Text style={[pdfStyles.td, { width: COLS[1].width }]}>{fmtDate(r.period_start)}</Text>
            <Text style={[pdfStyles.td, { width: COLS[2].width }]}>{fmtDate(r.period_end)}</Text>
            <Text style={[pdfStyles.td, { width: COLS[3].width }]}>{fmtMoney(r.base_rent_monthly)}</Text>
            <Text style={[pdfStyles.td, { width: COLS[4].width }]}>{fmtMoney(r.cam_estimated_monthly)}</Text>
            <Text style={[pdfStyles.td, { width: COLS[5].width, fontFamily: 'Helvetica-Bold' }]}>{fmtMoney(r.total_monthly)}</Text>
            <Text style={[pdfStyles.tdMuted, { width: COLS[6].width }]}>{r.notes ?? '—'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
