export function fmtMoney(n: number | null): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Lease dates live in Postgres `date` columns and arrive as 'YYYY-MM-DD', which Date parses
// as UTC midnight. Formatting in UTC keeps the calendar date intact; without it, viewers in
// negative-offset timezones see every lease date one day early. Timestamps (`timestamptz`
// columns such as created_at / uploaded_at) are a different case and should render locally.
const DATE_ONLY_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}

export function fmtDate(iso: string | null, placeholder = '—'): string {
  if (!iso) return placeholder
  return new Date(iso).toLocaleDateString('en-US', DATE_ONLY_FORMAT)
}
