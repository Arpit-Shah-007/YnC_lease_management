import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { getCurrentRentPeriod } from '@/lib/leaseRent'
import { fmtMoney } from '@/lib/format'
import { pdfStyles, COLORS } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'

type Props = { lease: LeaseWithRelations; accentColor: string }

export function AdditionalRentSection({ lease, accentColor }: Props) {
  const { monthly: baseRent, cam } = getCurrentRentPeriod(lease)
  const monthly = (baseRent ?? 0) + (cam ?? 0)

  const rows: [string, string][] = [
    ['Base Rent', fmtMoney(baseRent)],
    ['CAM Estimated', fmtMoney(cam)],
    ['Total Monthly', fmtMoney(monthly)],
    ['Square Footage', lease.square_footage ? `${lease.square_footage.toLocaleString()} SF` : '—'],
    // pro_rata_share is stored as a percentage already (10 = 10%), so it must not be scaled.
    ['Pro-Rata Share', lease.pro_rata_share != null ? `${lease.pro_rata_share.toFixed(2)}%` : '—'],
  ]

  return (
    <View wrap={false}>
      <SectionHeader title="Additional Rent" color={accentColor} />
      <View style={[pdfStyles.table, { flexDirection: 'row', flexWrap: 'wrap' }]}>
        {rows.map(([label, value], i) => (
          <View
            key={label}
            style={{
              width: '33.33%',
              padding: 6,
              borderRightWidth: (i + 1) % 3 === 0 ? 0 : 0.5,
              borderBottomWidth: i < rows.length - (rows.length % 3 || 3) ? 0.5 : 0,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ fontSize: 6, color: COLORS.textMuted, textTransform: 'uppercase' }}>{label}</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
