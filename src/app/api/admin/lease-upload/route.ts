import { createAdminClient } from '@/lib/supabase/admin'
import { extractLease } from '@/lib/extract/leaseExtractor'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const locationId = formData.get('locationId') as string | null

  if (!file || !locationId) {
    return NextResponse.json({ error: 'file and locationId are required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Upload PDF to Supabase Storage
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${locationId}/${Date.now()}_${safeFileName}`

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('leases')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Record the file in lease_files
  const { data: fileRecord, error: fileRecordError } = await supabase
    .from('lease_files')
    .insert({
      location_id: locationId,
      file_name: file.name,
      storage_bucket: 'leases',
      storage_path: storagePath,
      file_size_bytes: file.size,
      mime_type: 'application/pdf',
    })
    .select()
    .single()

  if (fileRecordError || !fileRecord) {
    return NextResponse.json({ error: fileRecordError?.message ?? 'Failed to record file' }, { status: 500 })
  }

  // Run AI extraction
  let extraction
  try {
    extraction = await extractLease(fileBuffer)
  } catch (err) {
    return NextResponse.json({
      error: `AI extraction failed: ${err instanceof Error ? err.message : 'check GROQ_API_KEY'}`,
    }, { status: 500 })
  }

  // Upsert lease (unique constraint on location_id)
  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .upsert(
      {
        location_id: locationId,
        lessee: extraction.lessee,
        lessor: extraction.lessor,
        possession_date: extraction.possession_date,
        commencement_date: extraction.commencement_date,
        expiry_date: extraction.expiry_date,
        term_type: extraction.term_type,
        square_footage: extraction.square_footage,
        base_rent_monthly: extraction.base_rent_monthly,
        cam_estimated_monthly: extraction.cam_estimated_monthly,
        pro_rata_share: extraction.pro_rata_share,
        status: 'active',
        extracted_at: new Date().toISOString(),
      },
      { onConflict: 'location_id' }
    )
    .select()
    .single()

  if (leaseError || !lease) {
    return NextResponse.json({ error: leaseError?.message ?? 'Failed to save lease' }, { status: 500 })
  }

  const leaseId = lease.id as string

  // Replace all related records
  await Promise.all([
    supabase.from('rent_schedule').delete().eq('lease_id', leaseId),
    supabase.from('critical_dates').delete().eq('lease_id', leaseId),
    supabase.from('clauses').delete().eq('lease_id', leaseId),
    supabase.from('cam_line_items').delete().eq('lease_id', leaseId),
  ])

  const inserts = await Promise.all([
    extraction.rent_schedule.length > 0
      ? supabase.from('rent_schedule').insert(
          extraction.rent_schedule.map((r, i) => ({ ...r, lease_id: leaseId, sort_order: i }))
        )
      : null,
    extraction.critical_dates.length > 0
      ? supabase.from('critical_dates').insert(
          extraction.critical_dates.map(d => ({ ...d, lease_id: leaseId }))
        )
      : null,
    extraction.clauses.length > 0
      ? supabase.from('clauses').insert(
          extraction.clauses.map(c => ({ ...c, lease_id: leaseId }))
        )
      : null,
    extraction.cam_line_items.length > 0
      ? supabase.from('cam_line_items').insert(
          extraction.cam_line_items.map(c => ({ ...c, lease_id: leaseId }))
        )
      : null,
  ])

  const insertErr = inserts.find(r => r !== null && r.error)
  if (insertErr?.error) {
    return NextResponse.json({ error: `Failed to save extracted data: ${insertErr.error.message}` }, { status: 500 })
  }

  // Link file to lease
  await supabase.from('lease_files').update({ lease_id: leaseId }).eq('id', fileRecord.id)

  return NextResponse.json({ success: true, leaseId, fileId: fileRecord.id })
}
