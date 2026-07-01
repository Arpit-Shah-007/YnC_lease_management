/**
 * fix-lease-data-remaining.mjs
 * Fixes wendys-7998 (Brick 2) and wendys-1875 (South Road, Poughkeepsie).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID as uuid } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var and re-run.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const dump = JSON.parse(readFileSync(path.join(__dirname, '..', 'data', 'lease-dump.json'), 'utf8'))

function p(label, start, end, monthly, sort) {
  return {
    id: uuid(), period_label: label, period_start: start, period_end: end,
    base_rent_monthly: monthly, base_rent_annual: +(monthly * 12).toFixed(2),
    cam_estimated_monthly: null, total_monthly: +monthly.toFixed(2),
    notes: null, sort_order: sort,
  }
}

function renew(date, days, notes) {
  return { id: uuid(), event_type: 'right_to_renew', event_date: date, notice_required_days: days, notes }
}

// ── wendys-7998: Brick 2 (555 Rt 70, Brick NJ) ──────────────────────────────
// 5-period step-up NNN ground lease; 4 auto-renewals × 5 yr
const brick2 = dump['wendys-7998']
const brick2Update = {
  rent_schedule: [
    p('Stub month',  '2025-06-02', '2025-06-30', 14783.47, 0),
    p('Yrs 1–5',     '2025-07-01', '2030-06-30', 15293.24, 1),
    p('Yrs 6–10',    '2030-07-01', '2035-06-30', 16822.56, 2),
    p('Yrs 11–15',   '2035-07-01', '2040-06-30', 18504.82, 3),
    p('Yrs 16–20',   '2040-07-01', '2045-06-30', 20355.30, 4),
    p('Yrs 21–25',   '2045-07-01', '2050-06-30', 22390.83, 5),
  ],
  critical_dates: [
    ...(brick2.lease.critical_dates ?? []),
    renew('2050-01-02', 180, '1st renewal (5-yr); effective Jul 1, 2050'),
    renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
    renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
    renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
  ],
}

// ── wendys-1875: South Road, Poughkeepsie NY ────────────────────────────────
// Commencement and expiry in DB are wrong (both set to the Y&C acquisition date
// 2025-06-02 instead of the actual lease date). Rent figure also wrong.
// Abstract: 3 stepped periods, 4 auto-renewals × 5 yr with 1-yr cancel notice.
const southRd = dump['wendys-1875']
const southRdUpdate = {
  commencement_date: '2022-07-01',
  expiry_date: '2034-12-31',
  base_rent_monthly: 12117.15,
  rent_schedule: [
    p('Period 1 (Yrs 1–2.5)',  '2022-07-01', '2024-12-31', 11091.67, 1),
    p('Period 2 (Yrs 3–7.5)',  '2025-01-01', '2029-12-31', 12117.15, 2),
    p('Period 3 (Yrs 8–12.5)', '2030-01-01', '2034-12-31', 13420.91, 3),
  ],
  critical_dates: [
    ...(southRd.lease.critical_dates ?? []),
    // Auto-renewal deadlines: notice must be sent 1 yr before current term end
    renew('2033-12-01', 365, '1st auto-renewal; effective Jan 1, 2035 — cancel notice due Dec 1, 2033'),
    renew('2038-12-01', 365, '2nd auto-renewal; effective Jan 1, 2040 — cancel notice due Dec 1, 2038'),
    renew('2043-12-01', 365, '3rd auto-renewal; effective Jan 1, 2045 — cancel notice due Dec 1, 2043'),
    renew('2048-12-01', 365, '4th auto-renewal; effective Jan 1, 2050 — cancel notice due Dec 1, 2048'),
  ],
}

async function applyFix(slug, leaseId, update) {
  const { error } = await sb.from('leases').update(update).eq('id', leaseId)
  if (error) { console.error(`[ERROR] ${slug}: ${error.message}`); return false }
  console.log(`[OK] ${slug}: ${Object.keys(update).join(', ')}`)
  return true
}

async function main() {
  let ok = 0
  if (await applyFix('wendys-7998', brick2.lease.id, brick2Update))   ok++
  if (await applyFix('wendys-1875', southRd.lease.id, southRdUpdate)) ok++
  console.log(`\nDone — ${ok}/2 updated`)
}

main().catch(e => { console.error(e); process.exit(1) })
