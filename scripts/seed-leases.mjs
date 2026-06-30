/**
 * seed-leases.mjs
 *
 * Updates all 38 leases with XLSX data (new fields) and uploads PDFs to Supabase Storage.
 * Run: node scripts/seed-leases.mjs
 */

import { createClient } from '@supabase/supabase-js'
import xlsx from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'lease_dataSource')

const SUPABASE_URL = 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGRuamJ0emt5dWdlb2Rpb3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMjI2NCwiZXhwIjoyMDk2Nzc4MjY0fQ.a1f4xrBYPHVKQK6AXjl0PYdVrr2kZWK8-Rf5TR5P7VM'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// XLSX Name column (first col, key '') → location slug
const XLSX_NAME_TO_SLUG = {
  '11807 Hatfield':      'wendys-11807',
  '2644 Conshohocken':   'wendys-2644',
  '2686 Souderton':      'wendys-2686',
  'TB Miltown':          'tacobell-030685',
  '8612 Morrisville':    'wendys-8612',
  '2230 Phoenixville 2': 'wendys-2230',
  '8616 Norristown 1':   'wendys-8616',
  '8617 Prussia':        'wendys-8617',
  '11858 Quakertown':    'wendys-11858',
  '12335 Bristol':       'wendys-12335',
  '11389 Howell 1':      'wendys-11389',
  'TB one path plaza':   'tacobell-041966',
  '2084 Royersford':     'wendys-2084',
  'South Road':          'wendys-9549',
  '1400 Horsham':        'wendys-1400',
  '455 Lansdale 1':      'wendys-455',
  '1875 Lansdale 2':     'wendys-1875',
  '13248 Eatontown':     'wendys-13248',
  '2444 Doylestown':     'wendys-2444',
  '527 Dresher':         'wendys-527',
  '11971 Montgomeryville': 'wendys-11971',
  '11187 Norristown 2':  'wendys-11187',
  '11228 Exton':         'wendys-11228',
  '1879 Collegeville':   'wendys-1879',
  'TB Bayonne':          'tacobell-034804',
  '11188 Phoenixville':  'wendys-11188',
  'TB 231 12th street':  'tacobell-040323',
  'TB Montgomery':       'tacobell-038857',
  'TB North Brunswick':  'tacobell-040482',
  'Clinton':             'wendys-13589',
  'Rockaway':            'wendys-13569',
  '245 12th street':     'wendys-13406',
  'TB Manville':         'tacobell-040306',
  '10803 Toms River':    'wendys-10803',
  '8186 Point Pleasant 1': 'wendys-8186',
  '9530 Whiting':        'wendys-9530',
  '5327 Brick 1':        'wendys-5327',
  '7998 Brick 2':        'wendys-7998',
}

// Slug → PDF directory under data/lease_dataSource/
// null means no PDF available for this location
const PDF_DIR_MAP = {
  'wendys-9549':       'South Rd',
  'wendys-11807':      'Hatfield',
  'wendys-2644':       'Conshohocken',
  'wendys-2686':       'Souderton',
  'wendys-8612':       'Morrisville',
  'wendys-2230':       'Township Line Rd Phoenixville',
  'wendys-8616':       '590 South Trooper Rd, Norristown',
  'wendys-8617':       'King of Prussia',
  'wendys-11858':      'Quakertown',
  'wendys-12335':      'Bristol',
  'wendys-11389':      'Howell',
  'wendys-2084':       'Royersford',
  'wendys-1400':       'Horsham',
  'wendys-455':        '600 South Broad St Lansdale',
  'wendys-1875':       null,
  'wendys-13248':      'Eatontown',
  'wendys-2444':       'Doylestown',
  'wendys-527':        'Dresher',
  'wendys-11971':      'Montgomeryville',
  'wendys-11187':      'Dekalb Pike Norristown',
  'wendys-11228':      'Exton',
  'wendys-1879':       'Collegeville',
  'wendys-11188':      '1540 Egypt Rd Phoenixville',
  'wendys-13589':      'Clinton',
  'wendys-13569':      'Rockaway',
  'wendys-13406':      '245 12th St',
  'wendys-10803':      'Toms River',
  'wendys-8186':       '3150 Rt 88 Point Pleasant',
  'wendys-9530':       'Whiting',
  'wendys-5327':       'Jack Martin Brick',
  'wendys-7998':       '555 Rt 70 Brick',
  'tacobell-030685':   'TB Milltown',
  'tacobell-041966':   'TB Path Plaza',
  'tacobell-034804':   'TB Bayonne',
  'tacobell-040323':   'TB 231 12th St',
  'tacobell-038857':   'TB Montgomery St',
  'tacobell-040482':   'TB North Brunswick',
  'tacobell-040306':   'TB Manville',
}

function excelSerial(serial) {
  if (serial == null || typeof serial !== 'number') return null
  return new Date((serial - 25569) * 86400 * 1000).toISOString().split('T')[0]
}

function parseTermMonths(val) {
  if (val == null) return null
  const n = parseInt(String(val))
  return isNaN(n) ? null : n
}

async function uploadPdf(locationId, filePath, existingFileNames) {
  const fileName = path.basename(filePath)
  if (existingFileNames.has(fileName)) {
    console.log(`    skip (already uploaded): ${fileName}`)
    return null
  }

  const fileBuffer = fs.readFileSync(filePath)
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${locationId}/${Date.now()}_${safeName}`

  const { error } = await sb.storage
    .from('leases')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

  if (error) {
    console.error(`    ERROR uploading ${fileName}: ${error.message}`)
    return null
  }

  console.log(`    uploaded: ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)`)
  return {
    id: crypto.randomUUID(),
    file_name: fileName,
    storage_bucket: 'leases',
    storage_path: storagePath,
    file_size_bytes: fileBuffer.length,
    mime_type: 'application/pdf',
    uploaded_at: new Date().toISOString(),
  }
}

async function main() {
  // ── 1. Read XLSX ──────────────────────────────────────────────────
  const wb = xlsx.readFile(path.join(DATA_DIR, 'Leases 2026-06-14.xlsx'))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const allRows = xlsx.utils.sheet_to_json(ws)
  // Skip 4 header rows (rows 0-2 metadata + row 3 column headers)
  const dataRows = allRows.slice(4)
  console.log(`Read ${dataRows.length} data rows from XLSX\n`)

  // Build slug → XLSX row map
  const xlsxBySlug = {}
  for (const row of dataRows) {
    const name = String(row[''] ?? '').trim()
    const slug = XLSX_NAME_TO_SLUG[name]
    if (slug) {
      xlsxBySlug[slug] = row
    } else {
      console.log(`[WARN] No slug mapping for XLSX name: "${name}"`)
    }
  }

  // ── 2. Fetch all locations ────────────────────────────────────────
  const { data: locations, error: locErr } = await sb
    .from('locations')
    .select('id, slug, lease_id')
  if (locErr) { console.error('Failed to fetch locations:', locErr.message); process.exit(1) }

  const slugToLocation = Object.fromEntries(locations.map(l => [l.slug, l]))

  // ── 3. Process each slug ──────────────────────────────────────────
  let updated = 0, skipped = 0, errors = 0

  for (const slug of Object.keys(PDF_DIR_MAP)) {
    const loc = slugToLocation[slug]
    if (!loc) {
      console.log(`[SKIP] Location not found in DB for slug: ${slug}`)
      skipped++
      continue
    }

    const { id: locationId, lease_id: leaseId } = loc
    if (!leaseId) {
      console.log(`[SKIP] No lease_id on location ${slug}`)
      skipped++
      continue
    }

    console.log(`\n[${slug}] lease=${leaseId.slice(0, 8)}...`)

    // ── 3a. Build update payload from XLSX ──────────────────────────
    const row = xlsxBySlug[slug]
    const payload = {}

    if (row) {
      const execution_date = excelSerial(row['__EMPTY_17'])
      const possession_date = excelSerial(row['__EMPTY_18'])
      const commencement_date = excelSerial(row['__EMPTY_19'])
      const expiry_date = excelSerial(row['__EMPTY_20'])
      const rent_commencement_date = excelSerial(row['__EMPTY_21'])
      const last_amended_date = excelSerial(row['__EMPTY_22'])
      const original_commencement_date = excelSerial(row['__EMPTY_30'])
      const rent_structure = row['__EMPTY_25'] ? String(row['__EMPTY_25']).trim() : null
      const security_deposit = typeof row['__EMPTY_26'] === 'number' ? row['__EMPTY_26'] : null
      const term_length_months = parseTermMonths(row['__EMPTY_13'])
      const area_unit = row['__EMPTY_11'] ? String(row['__EMPTY_11']).trim() : null
      const space_type = row['__EMPTY_9'] ? String(row['__EMPTY_9']).trim() : null
      const term_type = row['__EMPTY_12'] ? String(row['__EMPTY_12']).trim() : null
      const square_footage = typeof row['__EMPTY_10'] === 'number' ? row['__EMPTY_10'] : null
      const lessee = row['__EMPTY_24'] ? String(row['__EMPTY_24']).trim() : null
      const lessor = row['__EMPTY_23'] ? String(row['__EMPTY_23']).trim() : null
      const base_rent_monthly = typeof row['__EMPTY_15'] === 'number' ? row['__EMPTY_15'] : null

      if (execution_date) payload.execution_date = execution_date
      if (possession_date) payload.possession_date = possession_date
      if (commencement_date) payload.commencement_date = commencement_date
      if (expiry_date) payload.expiry_date = expiry_date
      if (rent_commencement_date) payload.rent_commencement_date = rent_commencement_date
      if (last_amended_date && last_amended_date !== '-') payload.last_amended_date = last_amended_date
      if (original_commencement_date) payload.original_commencement_date = original_commencement_date
      if (rent_structure) payload.rent_structure = rent_structure
      if (security_deposit != null) payload.security_deposit = security_deposit
      if (term_length_months != null) payload.term_length_months = term_length_months
      if (area_unit) payload.area_unit = area_unit
      if (space_type) payload.space_type = space_type
      if (term_type) payload.term_type = term_type
      if (square_footage != null) payload.square_footage = square_footage
      if (lessee) payload.lessee = lessee
      if (lessor) payload.lessor = lessor
      if (base_rent_monthly != null) payload.base_rent_monthly = base_rent_monthly

      console.log(`  XLSX: exec=${execution_date} | structure=${rent_structure} | term=${term_length_months}mo | deposit=${security_deposit ?? '-'}`)
    } else {
      console.log(`  [WARN] No XLSX data for ${slug}`)
    }

    // ── 3b. Upload PDFs ─────────────────────────────────────────────
    const dirName = PDF_DIR_MAP[slug]
    if (dirName !== null) {
      const pdfDir = path.join(DATA_DIR, dirName)
      if (!fs.existsSync(pdfDir)) {
        console.log(`  [WARN] PDF directory not found: ${pdfDir}`)
      } else {
        const { data: leaseRow } = await sb
          .from('leases')
          .select('lease_files')
          .eq('id', leaseId)
          .single()

        const existingFiles = leaseRow?.lease_files ?? []
        const existingNames = new Set(existingFiles.map(f => f.file_name))
        const pdfFiles = fs.readdirSync(pdfDir).filter(f => /\.pdf$/i.test(f))

        console.log(`  PDFs in ${dirName}: ${pdfFiles.join(', ')}`)

        const newEntries = []
        for (const pdfFile of pdfFiles) {
          const entry = await uploadPdf(locationId, path.join(pdfDir, pdfFile), existingNames)
          if (entry) newEntries.push(entry)
        }

        if (newEntries.length > 0) {
          payload.lease_files = [...newEntries, ...existingFiles]
        }
      }
    } else {
      console.log(`  PDFs: none (no directory for this location)`)
    }

    // ── 3c. Apply DB update ─────────────────────────────────────────
    if (Object.keys(payload).length > 0) {
      const { error: updateErr } = await sb
        .from('leases')
        .update(payload)
        .eq('id', leaseId)

      if (updateErr) {
        console.error(`  ERROR updating lease: ${updateErr.message}`)
        errors++
      } else {
        const fields = Object.keys(payload).filter(k => k !== 'lease_files')
        const filesCount = payload.lease_files ? payload.lease_files.length : 0
        console.log(`  OK updated: [${fields.join(', ')}]${filesCount ? ` + ${filesCount} files` : ''}`)
        updated++
      }
    } else {
      console.log(`  nothing to update`)
      skipped++
    }
  }

  console.log(`\n════════════════════════════`)
  console.log(`Done: ${updated} updated, ${skipped} skipped, ${errors} errors`)
}

main().catch(err => { console.error(err); process.exit(1) })
