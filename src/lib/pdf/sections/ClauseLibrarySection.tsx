import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { COLORS } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'

type Props = { lease: LeaseWithRelations; accentColor: string }

export function ClauseLibrarySection({ lease, accentColor }: Props) {
  const clauses = lease.clauses
  if (clauses.length === 0) return null

  const types = Array.from(new Set(clauses.map(c => c.clause_type))).sort()

  return (
    <View>
      <SectionHeader title="Clause Library" color={accentColor} />
      {types.map(type => (
        <View key={type} style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 3 }}>
            {type}
          </Text>
          {clauses.filter(c => c.clause_type === type).map(c => (
            <View key={c.id} wrap={false} style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingBottom: 5, marginBottom: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{c.title}</Text>
                {c.page_reference && (
                  <Text style={{ fontSize: 6, color: COLORS.textMuted }}>{c.page_reference}</Text>
                )}
              </View>
              <Text style={{ fontSize: 7, color: COLORS.textSecondary, lineHeight: 1.4, marginTop: 2 }}>
                {c.content}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
