import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'

export function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={pdfStyles.sectionHeader} wrap={false}>
      <View style={[pdfStyles.sectionBar, { backgroundColor: color }]} />
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
    </View>
  )
}
