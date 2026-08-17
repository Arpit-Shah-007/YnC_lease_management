import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import type { StaticLocation } from '@/lib/staticData'
import { buildKpiTiles } from '@/lib/leaseKpis'
import { fmtDate } from '@/lib/format'
import { pdfStyles, brandColor, COLORS } from './pdfStyles'
import { CamAuditSection } from './sections/CamAuditSection'
import { AdditionalRentSection } from './sections/AdditionalRentSection'
import { ClauseLibrarySection } from './sections/ClauseLibrarySection'
import { RentScheduleSection } from './sections/RentScheduleSection'
import { DatesOptionsSection } from './sections/DatesOptionsSection'

type Props = {
  location: StaticLocation
  lease: LeaseWithRelations
  mapImage: Buffer | null
}

export function LeaseSummaryDocument({ location, lease, mapImage }: Props) {
  const kpis = buildKpiTiles(lease)
  const isActive = lease.status === 'active'
  const accent = brandColor(location.brand)

  return (
    <Document title={`${location.display_name} — Lease Summary`}>
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.headerBar} fixed>
          <View>
            <Text style={pdfStyles.headerBrand}>Yum and Chill — Lease Management</Text>
            <Text style={pdfStyles.headerSub}>Lease Summary</Text>
          </View>
          <Text style={pdfStyles.headerLocation}>{location.display_name}</Text>
        </View>

        <View style={pdfStyles.card} wrap={false}>
          <View style={{ flexDirection: 'row' }}>
            {/* left: identity + map */}
            <View style={{ width: '42%', paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: accent, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginRight: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 6, fontFamily: 'Helvetica-Bold' }}>
                    {location.brand === 'tacobell' ? 'TACO BELL' : "WENDY'S"}
                  </Text>
                </View>
                <Text style={{ fontSize: 6.5, color: isActive ? COLORS.pos : '#b91c1c', fontFamily: 'Helvetica-Bold' }}>
                  {isActive ? 'ACTIVE' : lease.status.toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{location.address}</Text>
              <Text style={{ fontSize: 7.5, color: COLORS.textMuted, marginTop: 1, marginBottom: 6 }}>
                {location.city}, {location.state}, {location.country ?? 'US'}, {location.zip}
              </Text>

              {mapImage ? (
                <>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop; this isn't an HTML img */}
                  <Image src={{ data: mapImage, format: 'png' }} style={{ width: '100%', height: 120, borderRadius: 4 }} />
                  <Text style={{ fontSize: 5, color: COLORS.textMuted, marginTop: 2 }}>© OpenStreetMap contributors</Text>
                </>
              ) : (
                <View style={{ width: '100%', height: 120, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 7 }}>Map unavailable</Text>
                </View>
              )}
            </View>

            {/* right: term/lessee/lessor + kpi grid */}
            <View style={{ width: '58%' }}>
              <DetailRow label="Term" value={`${fmtDate(lease.commencement_date)} — ${fmtDate(lease.expiry_date)}`} />
              <DetailRow label="Lessee" value={lease.lessee ?? '—'} />
              <DetailRow label="Lessor" value={lease.lessor ?? '—'} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {kpis.map(kpi => (
                  <View key={kpi.label} style={{ width: '33.33%', borderWidth: 0.5, borderColor: COLORS.border, padding: 5 }}>
                    <Text style={{ fontSize: 5.5, color: COLORS.textMuted, textTransform: 'uppercase' }}>{kpi.label}</Text>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>{kpi.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Each card may break across pages when its content is long. minPresenceAhead stops a
            card from starting with only its top border and a sliver of content on a page. */}
        <View style={pdfStyles.card} minPresenceAhead={90}>
          <CamAuditSection lease={lease} accentColor={accent} />
        </View>

        {/* Fixed five-cell grid, always short enough to keep whole. */}
        <View style={pdfStyles.card} wrap={false}>
          <AdditionalRentSection lease={lease} accentColor={accent} />
        </View>

        <View style={pdfStyles.card} minPresenceAhead={90}>
          <RentScheduleSection lease={lease} accentColor={accent} />
        </View>

        <View style={pdfStyles.card} minPresenceAhead={90}>
          <DatesOptionsSection lease={lease} accentColor={accent} />
        </View>

        <View style={pdfStyles.card} minPresenceAhead={90}>
          <ClauseLibrarySection lease={lease} accentColor={accent} />
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>{location.address}, {location.city}, {location.state} {location.zip}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}>
      <Text style={{ width: 40, color: COLORS.textMuted, fontSize: 6.5 }}>{label}</Text>
      <Text style={{ fontSize: 7 }}>{value}</Text>
    </View>
  )
}
