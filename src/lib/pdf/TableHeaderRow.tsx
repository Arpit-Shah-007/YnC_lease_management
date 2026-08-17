import { View, Text } from '@react-pdf/renderer'
import { pdfStyles } from './pdfStyles'

type Column = { readonly key: string; readonly label: string; readonly width: string }

/**
 * A table's header row, kept on the same page as the first rows beneath it.
 *
 * react-pdf has no repeating-header primitive: `fixed` would stamp the row onto every page of
 * the document, not just the pages this table spans. So rather than repeating the header we
 * make sure it never separates from its data — `minPresenceAhead` reserves space for the
 * first few rows, pushing the whole table to the next page when only the header would fit.
 */
export function TableHeaderRow({ columns, rowsAhead = 3 }: { columns: readonly Column[]; rowsAhead?: number }) {
  return (
    <View style={pdfStyles.tableHeaderRow} wrap={false} minPresenceAhead={16 * rowsAhead}>
      {columns.map(c => (
        <Text key={c.key} style={[pdfStyles.th, { width: c.width }]}>{c.label}</Text>
      ))}
    </View>
  )
}
