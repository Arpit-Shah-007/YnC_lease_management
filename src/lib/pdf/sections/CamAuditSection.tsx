import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { findClause, parseListItems, computeCamCapPct, computeCapRows } from '@/lib/camAudit'
import { fmtMoney } from '@/lib/format'
import { pdfStyles, COLORS } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'

const CAP_COLS = [
  { key: 'year', label: 'Lease Year', width: '28%' },
  { key: 'annual', label: 'Annual Rent', width: '24%' },
  { key: 'cap', label: 'CAM Cap', width: '24%' },
  { key: 'billed', label: 'Billed', width: '24%' },
] as const

type Props = { lease: LeaseWithRelations; accentColor: string }

export function CamAuditSection({ lease, accentColor }: Props) {
  const { clauses, rent_schedule, cam_line_items } = lease
  const capPct = computeCamCapPct(clauses)
  const capRows = computeCapRows(rent_schedule, cam_line_items, capPct)

  const permittedClause = findClause(clauses, 'cam_permitted', 'permitted in cam', 'cam inclusions', 'cam inclusion')
  const excludedClause = findClause(clauses, 'cam_excluded', 'excluded from cam', 'cam exclusions', 'cam exclusion', 'cam_exclusion')
  const permittedItems = permittedClause ? parseListItems(permittedClause.content) : []
  const excludedItems = excludedClause ? parseListItems(excludedClause.content) : []

  if (capRows.length === 0 && permittedItems.length === 0 && excludedItems.length === 0) return null

  return (
    <View>
      <SectionHeader title={`CAM / Operating Expense Audit (${capPct}% cap)`} color={accentColor} />

      {capRows.length > 0 && (
        <View style={[pdfStyles.table, { marginBottom: 6 }]}>
          <View style={pdfStyles.tableHeaderRow}>
            {CAP_COLS.map(c => (
              <Text key={c.key} style={[pdfStyles.th, { width: c.width }]}>{c.label}</Text>
            ))}
          </View>
          {capRows.map(({ row, annual, cap, billed }, i) => (
            <View key={i} wrap={false} style={i === capRows.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}>
              <Text style={[pdfStyles.td, { width: CAP_COLS[0].width }]}>{row.period_label ?? '—'}</Text>
              <Text style={[pdfStyles.td, { width: CAP_COLS[1].width }]}>{fmtMoney(annual)}</Text>
              <Text style={[pdfStyles.td, { width: CAP_COLS[2].width, fontFamily: 'Helvetica-Bold' }]}>{fmtMoney(cap)}</Text>
              <Text style={[pdfStyles.tdMuted, { width: CAP_COLS[3].width }]}>{fmtMoney(billed)}</Text>
            </View>
          ))}
        </View>
      )}

      {(permittedItems.length > 0 || excludedItems.length > 0) && (
        <View style={{ flexDirection: 'row' }} wrap={false}>
          {permittedItems.length > 0 && (
            <View style={{ width: '50%', paddingRight: 6 }}>
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: COLORS.pos, marginBottom: 2 }}>PERMITTED IN CAM</Text>
              {permittedItems.map((item, i) => (
                <Text key={i} style={{ fontSize: 6.5, marginBottom: 1, color: COLORS.textSecondary }}>+ {item}</Text>
              ))}
            </View>
          )}
          {excludedItems.length > 0 && (
            <View style={{ width: '50%', paddingLeft: 6 }}>
              <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#b91c1c', marginBottom: 2 }}>EXCLUDED FROM CAM</Text>
              {excludedItems.map((item, i) => (
                <Text key={i} style={{ fontSize: 6.5, marginBottom: 1, color: COLORS.textSecondary }}>− {item}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}
