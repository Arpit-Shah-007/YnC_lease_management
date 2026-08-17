import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import {
  findClause,
  parseListItems,
  computeCamCapPct,
  computeCapRows,
  buildCamSummary,
} from '@/lib/camAudit'
import { fmtMoney } from '@/lib/format'
import { pdfStyles, COLORS } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'
import { TableHeaderRow } from '../TableHeaderRow'

const CAP_COLS = [
  { key: 'year', label: 'Lease Year', width: '28%' },
  { key: 'annual', label: 'Annual Rent', width: '24%' },
  { key: 'cap', label: 'CAM Cap', width: '24%' },
  { key: 'billed', label: 'Billed', width: '24%' },
] as const

const AUDIT_COLS = [
  { key: 'year', label: 'Year', width: '10%' },
  { key: 'verdict', label: 'Verdict', width: '13%' },
  { key: 'estimate', label: 'Estimate', width: '19%' },
  { key: 'actual', label: 'Actual', width: '19%' },
  { key: 'cap', label: 'Cap', width: '19%' },
  { key: 'over', label: 'Over Cap', width: '20%' },
] as const

const VERDICT_COLOR: Record<string, string> = {
  ok: COLORS.pos,
  high: '#b91c1c',
  low: COLORS.warn,
}

type Props = { lease: LeaseWithRelations; accentColor: string }

export function CamAuditSection({ lease, accentColor }: Props) {
  const { clauses, rent_schedule, cam_line_items } = lease
  const capPct = computeCamCapPct(clauses)
  const capRows = computeCapRows(rent_schedule, cam_line_items, capPct)
  const summary = buildCamSummary(lease)

  const permittedClause = findClause(clauses, 'cam_permitted', 'permitted in cam', 'cam inclusions', 'cam inclusion')
  const excludedClause = findClause(clauses, 'cam_excluded', 'excluded from cam', 'cam exclusions', 'cam exclusion', 'cam_exclusion')
  const permittedItems = permittedClause ? parseListItems(permittedClause.content) : []
  const excludedItems = excludedClause ? parseListItems(excludedClause.content) : []

  const auditedRows = summary.rows.filter(r => r.verdict != null)

  if (
    capRows.length === 0 &&
    auditedRows.length === 0 &&
    permittedItems.length === 0 &&
    excludedItems.length === 0
  ) return null

  return (
    <View>
      <SectionHeader title={`CAM / Operating Expense Audit (${capPct}% cap)`} color={accentColor} />

      {/* Derived audit outcome — kept atomic, it is only a few lines tall. */}
      {auditedRows.length > 0 && (
        <View
          wrap={false}
          style={{
            backgroundColor: summary.totalOverage > 0 ? '#fef2f2' : COLORS.posSoft,
            borderWidth: 0.5,
            borderColor: summary.totalOverage > 0 ? '#fca5a5' : COLORS.pos,
            borderRadius: 4,
            padding: 6,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Helvetica-Bold',
              color: summary.totalOverage > 0 ? '#b91c1c' : COLORS.pos,
            }}
          >
            {summary.totalOverage > 0
              ? `${fmtMoney(summary.totalOverage)} billed over cap across ${summary.overCapCount} ${summary.overCapCount === 1 ? 'year' : 'years'}`
              : 'Within cap in every audited year'}
          </Text>
          <Text style={{ fontSize: 6.5, color: COLORS.textSecondary, marginTop: 2 }}>
            {summary.analyzedCount} of {summary.rows.length} {summary.rows.length === 1 ? 'year' : 'years'} audited
            {' · '}Total billed {fmtMoney(summary.totalBilled)}
            {' · '}Total cap {fmtMoney(summary.totalCap)}
            {summary.flaggedCount > 0 && ` · ${summary.flaggedCount} flagged item${summary.flaggedCount === 1 ? '' : 's'}`}
          </Text>
        </View>
      )}

      {/* Per-year audit results */}
      {auditedRows.length > 0 && (
        <View style={[pdfStyles.table, { marginBottom: 6 }]}>
          <TableHeaderRow columns={AUDIT_COLS} rowsAhead={2} />
          {auditedRows.map((r, i) => (
            <View
              key={r.year}
              wrap={false}
              style={i === auditedRows.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}
            >
              <Text style={[pdfStyles.td, { width: AUDIT_COLS[0].width, fontFamily: 'Helvetica-Bold' }]}>{r.year}</Text>
              <Text
                style={[pdfStyles.td, {
                  width: AUDIT_COLS[1].width,
                  fontFamily: 'Helvetica-Bold',
                  color: VERDICT_COLOR[r.verdict ?? 'ok'],
                }]}
              >
                {(r.verdict ?? '').toUpperCase()}
              </Text>
              <Text style={[pdfStyles.td, { width: AUDIT_COLS[2].width }]}>{fmtMoney(r.estimateTotal)}</Text>
              <Text style={[pdfStyles.td, { width: AUDIT_COLS[3].width }]}>{fmtMoney(r.actualTotal)}</Text>
              <Text style={[pdfStyles.td, { width: AUDIT_COLS[4].width }]}>{fmtMoney(r.capAmount)}</Text>
              <Text
                style={[pdfStyles.td, {
                  width: AUDIT_COLS[5].width,
                  fontFamily: r.overage && r.overage > 0 ? 'Helvetica-Bold' : 'Helvetica',
                  color: r.overage && r.overage > 0 ? '#b91c1c' : COLORS.textMuted,
                }]}
              >
                {r.overage != null ? fmtMoney(r.overage) : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Flagged items, one atomic block per year so a year's findings stay together. */}
      {auditedRows.filter(r => r.flaggedItems.length > 0).map(r => (
        <View key={`flag-${r.year}`} style={{ marginBottom: 5 }} minPresenceAhead={30}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#b91c1c', marginBottom: 2 }}>
            {r.year} — FLAGGED
          </Text>
          {r.flaggedItems.map((item, i) => (
            <Text key={i} style={{ fontSize: 6.5, color: COLORS.textSecondary, marginBottom: 1 }}>
              • {item}
            </Text>
          ))}
        </View>
      ))}

      {capRows.length > 0 && (
        <View style={[pdfStyles.table, { marginBottom: 6 }]}>
          <TableHeaderRow columns={CAP_COLS} />
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

      {/* Permitted/excluded lists can run to dozens of entries, so these columns must be
          allowed to break across pages — wrap={false} would clip anything over a page. */}
      {(permittedItems.length > 0 || excludedItems.length > 0) && (
        <View style={{ flexDirection: 'row' }} minPresenceAhead={40}>
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
