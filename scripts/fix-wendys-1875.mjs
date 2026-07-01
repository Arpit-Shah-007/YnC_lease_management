import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SUPABASE_URL = 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var and re-run.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── 1. Look up location ──────────────────────────────────────────────────────
const { data: loc } = await sb
  .from('locations')
  .select('id, slug, city, lease_id')
  .eq('store_number', '1875')
  .maybeSingle()

if (!loc) { console.error('Location not found for store_number 1875'); process.exit(1) }
console.log(`Location: ${loc.slug} | city: ${loc.city} | lease_id: ${loc.lease_id}`)

const LOCATION_ID = loc.id
const LEASE_ID = loc.lease_id

// ── 2. Build correct 6-period rent schedule ──────────────────────────────────
const correctSchedule = [
  {
    id: randomUUID(),
    sort_order: 1,
    period_label: 'Yrs 1–5',
    period_start: '2015-12-01',
    period_end: '2020-11-30',
    base_rent_monthly: 9284.64,
    base_rent_annual: 111415.72,
    cam_estimated_monthly: null,
    total_monthly: 9284.64,
    notes: null,
  },
  {
    id: randomUUID(),
    sort_order: 2,
    period_label: 'Yrs 6–10',
    period_start: '2020-12-01',
    period_end: '2025-11-30',
    base_rent_monthly: 10213.11,
    base_rent_annual: 122557.29,
    cam_estimated_monthly: null,
    total_monthly: 10213.11,
    notes: null,
  },
  {
    id: randomUUID(),
    sort_order: 3,
    period_label: 'Yrs 11–15',
    period_start: '2025-12-01',
    period_end: '2030-11-30',
    base_rent_monthly: 11234.42,
    base_rent_annual: 134813.02,
    cam_estimated_monthly: null,
    total_monthly: 11234.42,
    notes: null,
  },
  {
    id: randomUUID(),
    sort_order: 4,
    period_label: 'Yrs 16–20',
    period_start: '2030-12-01',
    period_end: '2035-11-30',
    base_rent_monthly: 12357.86,
    base_rent_annual: 148294.32,
    cam_estimated_monthly: null,
    total_monthly: 12357.86,
    notes: null,
  },
  {
    id: randomUUID(),
    sort_order: 5,
    period_label: 'Yrs 21–25',
    period_start: '2035-12-01',
    period_end: '2040-11-30',
    base_rent_monthly: 13593.65,
    base_rent_annual: 163123.76,
    cam_estimated_monthly: null,
    total_monthly: 13593.65,
    notes: null,
  },
  {
    id: randomUUID(),
    sort_order: 6,
    period_label: 'Yrs 26–29',
    period_start: '2040-12-01',
    period_end: '2044-11-30',
    base_rent_monthly: 14953.01,
    base_rent_annual: 179436.13,
    cam_estimated_monthly: null,
    total_monthly: 14953.01,
    notes: null,
  },
]

// ── 3. Update lease ──────────────────────────────────────────────────────────
const { error: leaseErr } = await sb
  .from('leases')
  .update({
    commencement_date: '2015-11-30',
    execution_date: '2015-11-30',
    original_commencement_date: '2015-11-30',
    possession_date: '2025-06-02',
    rent_commencement_date: '2025-06-02',
    expiry_date: '2035-11-30',
    term_length_months: 240,
    base_rent_monthly: 9284.64,
    lessee: 'Lansdale 2 Wen LLC (assigned to Y & C Wen PA LLC)',
    lessor: "Wendy's Properties, LLC",
    rent_schedule: correctSchedule,
  })
  .eq('id', LEASE_ID)

if (leaseErr) { console.error('Lease update failed:', leaseErr.message); process.exit(1) }
console.log('Lease dates, rent, and schedule updated.')

// ── 4. Upload PDFs to storage ────────────────────────────────────────────────
const docs = [
  { localPath: 'data/lease_dataSource/1758 Allentown Rd, Lansdale/1875 Lans 2 Sublease.pdf', displayName: '1875 Lans 2 Sublease.pdf' },
  { localPath: 'data/lease_dataSource/1758 Allentown Rd, Lansdale/1875 Lansdale 2 Abstract.pdf', displayName: '1875 Lansdale 2 Abstract.pdf' },
]

const leaseFileEntries = []

for (const doc of docs) {
  const filePath = join(ROOT, doc.localPath)
  const fileBuffer = readFileSync(filePath)
  const safeFileName = doc.displayName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${LOCATION_ID}/${Date.now()}_${safeFileName}`

  const { error: uploadErr } = await sb.storage
    .from('leases')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadErr) {
    console.error(`Storage upload failed for ${doc.displayName}:`, uploadErr.message)
    process.exit(1)
  }

  leaseFileEntries.push({
    id: randomUUID(),
    file_name: doc.displayName,
    storage_bucket: 'leases',
    storage_path: storagePath,
    file_size_bytes: fileBuffer.length,
    mime_type: 'application/pdf',
    uploaded_at: new Date().toISOString(),
  })
  console.log(`Uploaded: ${doc.displayName}`)
}

// ── 5. Persist file entries to lease_files JSONB ─────────────────────────────
const { error: filesErr } = await sb
  .from('leases')
  .update({ lease_files: leaseFileEntries })
  .eq('id', LEASE_ID)

if (filesErr) { console.error('lease_files update failed:', filesErr.message); process.exit(1) }
console.log('lease_files updated with', leaseFileEntries.length, 'documents.')

// ── 6. Verify ────────────────────────────────────────────────────────────────
const { data: verify } = await sb
  .from('leases')
  .select('commencement_date, expiry_date, base_rent_monthly, rent_schedule, lease_files')
  .eq('id', LEASE_ID)
  .maybeSingle()

const today = new Date('2026-07-01')
const active = verify.rent_schedule.find(r =>
  today >= new Date(r.period_start) && today <= new Date(r.period_end)
)

console.log('\n── Verification ─────────────────────────────────────────────')
console.log('commencement_date :', verify.commencement_date)
console.log('expiry_date       :', verify.expiry_date)
console.log('base_rent_monthly :', verify.base_rent_monthly)
console.log('active period     :', active?.period_label)
console.log('current rent      :', active?.base_rent_monthly, '(expected: 11234.42)')
console.log('documents         :', verify.lease_files.map(f => f.file_name).join(', '))
