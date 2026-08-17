import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'

type Props = {
  title: string
  color: string
  /**
   * Points of following content that must fit on the same page as this heading. Without it a
   * heading can land on the last line of a page with its table starting on the next one.
   * The default reserves roughly a table header plus three rows.
   */
  minPresenceAhead?: number
}

export function SectionHeader({ title, color, minPresenceAhead = 72 }: Props) {
  return (
    <View style={pdfStyles.sectionHeader} wrap={false} minPresenceAhead={minPresenceAhead}>
      <View style={[pdfStyles.sectionBar, { backgroundColor: color }]} />
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
    </View>
  )
}
