import { View, Text } from '@react-pdf/renderer'
import type { LeaseWithRelations } from '@/types/database'
import { humanizeClauseType } from '@/lib/camAudit'
import { COLORS } from '../pdfStyles'
import { SectionHeader } from '../SectionHeader'

type Props = { lease: LeaseWithRelations; accentColor: string }

export function ClauseLibrarySection({ lease, accentColor }: Props) {
  const clauses = lease.clauses
  if (clauses.length === 0) return null

  const groups = Array.from(new Set(clauses.map(c => c.clause_type)))
    .map(type => ({ type, label: humanizeClauseType(type), items: clauses.filter(c => c.clause_type === type) }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <View>
      <SectionHeader title="Clause Library" color={accentColor} />
      {groups.map(group => (
        <View key={group.type} style={{ marginBottom: 6 }}>
          {/* Reserve room for the group label plus the start of its first clause, so a
              heading never sits alone at the foot of a page. */}
          <Text
            style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 3 }}
            minPresenceAhead={34}
          >
            {group.label}
          </Text>
          {group.items.map(c => (
            // Deliberately wrappable: clause text can run longer than a page, and
            // wrap={false} would clip the overflow instead of continuing it overleaf.
            <View
              key={c.id}
              style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingBottom: 5, marginBottom: 5 }}
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                wrap={false}
                minPresenceAhead={24}
              >
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold' }}>{c.title}</Text>
                {c.page_reference && (
                  <Text style={{ fontSize: 6, color: COLORS.textMuted }}>{c.page_reference}</Text>
                )}
              </View>
              <Text
                style={{ fontSize: 7, color: COLORS.textSecondary, lineHeight: 1.4, marginTop: 2 }}
                orphans={2}
                widows={2}
              >
                {c.content}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}
