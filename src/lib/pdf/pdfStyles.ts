import { StyleSheet } from '@react-pdf/renderer'

// Mirrors the design tokens in src/app/globals.css so the PDF reads like the live app.
export const COLORS = {
  yc: '#16082e',
  bg: '#faf8fc',
  surface: '#ffffff',
  surfaceAlt: '#f5f3f9',
  border: '#e8e3f0',
  borderStrong: '#d4cedf',
  textPrimary: '#1a1523',
  textSecondary: '#574f65',
  textMuted: '#8a7f98',
  pos: '#1f7a4d',
  posSoft: '#e7f4ee',
  warn: '#9a6a00',
  purple: '#7c3aed',
  accentWendys: '#e2211c',
  accentTacobell: '#702082',
}

export function brandColor(brand: string): string {
  return brand === 'tacobell' ? COLORS.accentTacobell : COLORS.accentWendys
}

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 30,
    paddingHorizontal: 26,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bg,
  },

  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: COLORS.yc,
    paddingHorizontal: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  headerSub: { fontSize: 6.5, color: '#cabfdb', marginTop: 1 },
  headerLocation: { fontSize: 8.5, color: '#ffffff', fontFamily: 'Helvetica-Bold' },

  footer: {
    position: 'absolute',
    bottom: 12,
    left: 26,
    right: 26,
    fontSize: 6.5,
    color: COLORS.textMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 5,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  sectionBar: { width: 3, height: 10, borderRadius: 2, marginRight: 5 },
  sectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: COLORS.textPrimary },

  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  th: {
    padding: 4,
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  td: {
    padding: 4,
    fontSize: 7,
    color: COLORS.textSecondary,
  },
  tdMuted: {
    padding: 4,
    fontSize: 7,
    color: COLORS.textMuted,
  },
})
