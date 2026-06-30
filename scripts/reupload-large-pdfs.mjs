/**
 * reupload-large-pdfs.mjs
 *
 * Re-uploads the 2 large PDFs that exceeded Supabase's default 50 MB limit.
 * Run AFTER raising the bucket limit to 200 MB:
 *   update storage.buckets set file_size_limit = 209715200 where name = 'leases';
 *
 * Run: node scripts/reupload-large-pdfs.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data', 'lease_dataSource')

const SUPABASE_URL = 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGRuamJ0emt5dWdlb2Rpb3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMjI2NCwiZXhwIjoyMDk2Nzc4MjY0fQ.a1f4xrBYPHVKQK6AXjl0PYdVrr2kZWK8-Rf5TR5P7VM'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Only the 2 locations whose large PDFs failed.
// Using 150 DPI re-rendered versions (13-14 MB each, well under 50 MB limit).
const TARGETS = [
  {
    slug: 'tacobell-040323',
    dir: 'TB 231 12th St',
    fileFilter: name => name.includes('_150dpi'),
  },
  {
    slug: 'tacobell-030685',
    dir: 'TB Milltown',
    fileFilter: name => name.includes('_150dpi'),
  },
]

async function main() {
  for (const target of TARGETS) {
    console.log(`\n[${target.slug}]`)

    // Find location
    const { data: loc, error: locErr } = await sb
      .from('locations')
      .select('id, lease_id')
      .eq('slug', target.slug)
      .single()

    if (locErr || !loc) {
      console.error(`  ERROR: location not found — ${locErr?.message}`)
      continue
    }

    const locationId = loc.id
    const leaseId = loc.lease_id

    if (!leaseId) {
      console.error(`  ERROR: no lease_id on location`)
      continue
    }

    // Fetch current lease_files
    const { data: lease, error: leaseErr } = await sb
      .from('leases')
      .select('lease_files')
      .eq('id', leaseId)
      .single()

    if (leaseErr || !lease) {
      console.error(`  ERROR: lease not found — ${leaseErr?.message}`)
      continue
    }

    const existingFiles = (lease.lease_files ?? [])
    const existingFileNames = new Set(existingFiles.map(f => f.file_name))
    console.log(`  existing files: ${[...existingFileNames].join(', ') || '(none)'}`)

    // Find PDFs in the directory
    const dirPath = path.join(DATA_DIR, target.dir)
    if (!fs.existsSync(dirPath)) {
      console.error(`  ERROR: directory not found: ${dirPath}`)
      continue
    }

    const allFiles = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith('.pdf'))
    const toUpload = allFiles.filter(f => target.fileFilter(f) && !existingFileNames.has(f))

    if (toUpload.length === 0) {
      console.log(`  nothing to upload (files already present or no match)`)
      continue
    }

    const newEntries = []

    for (const fileName of toUpload) {
      const filePath = path.join(dirPath, fileName)
      const fileBuffer = fs.readFileSync(filePath)
      const sizeMB = (fileBuffer.length / 1024 / 1024).toFixed(1)
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${locationId}/${Date.now()}_${safeName}`

      console.log(`  uploading: ${fileName} (${sizeMB} MB) ...`)

      const { error: uploadErr } = await sb.storage
        .from('leases')
        .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

      if (uploadErr) {
        console.error(`  ERROR: ${uploadErr.message}`)
        continue
      }

      console.log(`  uploaded OK`)
      newEntries.push({
        id: crypto.randomUUID(),
        file_name: fileName,
        storage_bucket: 'leases',
        storage_path: storagePath,
        file_size_bytes: fileBuffer.length,
        mime_type: 'application/pdf',
        uploaded_at: new Date().toISOString(),
      })
    }

    if (newEntries.length === 0) continue

    // Append to lease_files
    const { error: updateErr } = await sb
      .from('leases')
      .update({ lease_files: [...newEntries, ...existingFiles] })
      .eq('id', leaseId)

    if (updateErr) {
      console.error(`  ERROR updating lease_files: ${updateErr.message}`)
    } else {
      console.log(`  lease_files updated (+${newEntries.length} file${newEntries.length > 1 ? 's' : ''})`)
    }
  }

  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
