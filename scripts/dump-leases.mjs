/**
 * dump-leases.mjs
 * Exports all lease data from Supabase to data/lease-dump.json
 * Run: node scripts/dump-leases.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGRuamJ0emt5dWdlb2Rpb3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMjI2NCwiZXhwIjoyMDk2Nzc4MjY0fQ.a1f4xrBYPHVKQK6AXjl0PYdVrr2kZWK8-Rf5TR5P7VM'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

async function main() {
  const { data: locations, error: locErr } = await sb
    .from('locations')
    .select('id, slug, display_name, address, city, state, zip, brand, lease_id')
    .order('slug')

  if (locErr) { console.error('Failed to fetch locations:', locErr.message); process.exit(1) }

  const { data: leases, error: leaseErr } = await sb
    .from('leases')
    .select('*')

  if (leaseErr) { console.error('Failed to fetch leases:', leaseErr.message); process.exit(1) }

  const leaseById = Object.fromEntries(leases.map(l => [l.id, l]))

  const dump = {}
  for (const loc of locations) {
    const lease = loc.lease_id ? leaseById[loc.lease_id] : null
    dump[loc.slug] = {
      location: {
        id: loc.id,
        slug: loc.slug,
        display_name: loc.display_name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        brand: loc.brand,
      },
      lease: lease ? {
        id: lease.id,
        lessee: lease.lessee,
        lessor: lease.lessor,
        execution_date: lease.execution_date,
        possession_date: lease.possession_date,
        commencement_date: lease.commencement_date,
        expiry_date: lease.expiry_date,
        rent_commencement_date: lease.rent_commencement_date,
        original_commencement_date: lease.original_commencement_date,
        last_amended_date: lease.last_amended_date,
        term_type: lease.term_type,
        rent_structure: lease.rent_structure,
        term_length_months: lease.term_length_months,
        square_footage: lease.square_footage,
        area_unit: lease.area_unit,
        space_type: lease.space_type,
        base_rent_monthly: lease.base_rent_monthly,
        cam_estimated_monthly: lease.cam_estimated_monthly,
        pro_rata_share: lease.pro_rata_share,
        security_deposit: lease.security_deposit,
        status: lease.status,
        rent_schedule: lease.rent_schedule,
        critical_dates: lease.critical_dates,
      } : null,
    }
  }

  const outPath = path.join(__dirname, '..', 'data', 'lease-dump.json')
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2))
  console.log(`Wrote ${Object.keys(dump).length} locations to ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })
