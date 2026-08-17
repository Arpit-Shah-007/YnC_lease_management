import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { fmtDate } from '@/lib/format'
import { pdfStyles } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'
import { TableHeaderRow } from '../TableHeaderRow'

const COLS = [
  { key: 'event', label: 'Event', width: '22%' },
  { key: 'date', label: 'Date', width: '14%' },
  { key: 'notice', label: 'Notice Required', width: '16%' },
  { key: 'notes', label: 'Notes', width: '48%' },
] as const

type Props = { lease: LeaseWithRelations; accentColor: string }

export function DatesOptionsSection({ lease, accentColor }: Props) {
  const sorted = [...lease.critical_dates].sort((a, b) => {
    if (!a.event_date) return 1
    if (!b.event_date) return -1
    return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  })
  if (sorted.length === 0) return null

  return (
    <View>
      <SectionHeader title="Dates & Options" color={accentColor} />
      <View style={pdfStyles.table}>
        <TableHeaderRow columns={COLS} />
        {sorted.map((d, i) => (
          <View key={d.id} wrap={false} style={i === sorted.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
            <Text style={[pdfStyles.td, { width: COLS[0].width, fontFamily: 'Helvetica-Bold' }]}>{d.event_type}</Text>
            <Text style={[pdfStyles.td, { width: COLS[1].width }]}>{fmtDate(d.event_date)}</Text>
            <Text style={[pdfStyles.td, { width: COLS[2].width }]}>
              {d.notice_required_days != null ? `${d.notice_required_days}d` : '—'}
            </Text>
            <Text style={[pdfStyles.tdMuted, { width: COLS[3].width }]}>{d.notes ?? '—'}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
