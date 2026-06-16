import { createAdminClient } from '@/lib/supabase/admin'
import { extractLease } from '@/lib/extract/leaseExtractor'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  let body: { storagePath: string; locationId: string; leaseFileId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { storagePath, locationId, leaseFileId } = body

  if (!storagePath || !locationId) {
    return NextResponse.json(
      { error: 'storagePath and locationId are required' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Download PDF bytes from Supabase Storage
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from('leases')
    .download(storagePath)

  if (downloadError || !fileBlob) {
    return NextResponse.json({ error: 'Failed to download PDF from storage' }, { status: 500 })
  }

  const pdfBuffer = Buffer.from(await fileBlob.arrayBuffer())

  // Run AI extraction
  let extraction
  try {
    extraction = await extractLease(pdfBuffer)
  } catch {
    return NextResponse.json({ error: 'AI extraction failed — check GROQ_API_KEY' }, { status: 500 })
  }

  // Upsert lease (unique constraint on location_id means update if exists)
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

  const leaseId = lease.id

  // Replace all related records (delete + insert)
  const deleteResults = await Promise.all([
    supabase.from('rent_schedule').delete().eq('lease_id', leaseId),
    supabase.from('critical_dates').delete().eq('lease_id', leaseId),
    supabase.from('clauses').delete().eq('lease_id', leaseId),
    supabase.from('cam_line_items').delete().eq('lease_id', leaseId),
  ])
  const deleteError = deleteResults.find(r => r.error)
  if (deleteError?.error) {
    return NextResponse.json({ error: `Failed to clear existing data: ${deleteError.error.message}` }, { status: 500 })
  }

  const insertResults = await Promise.all([
    extraction.rent_schedule.length > 0
      ? supabase.from('rent_schedule').insert(
          extraction.rent_schedule.map((r, i) => ({
            ...r,
            lease_id: leaseId,
            sort_order: i,
          }))
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
  const insertError = insertResults.find(r => r !== null && r.error)
  if (insertError && insertError.error) {
    return NextResponse.json({ error: `Failed to save extracted data: ${insertError.error.message}` }, { status: 500 })
  }

  // Link file to lease
  if (leaseFileId) {
    await supabase
      .from('lease_files')
      .update({ lease_id: leaseId })
      .eq('id', leaseFileId)
  }

  // Mark location as active
  await supabase
    .from('locations')
    .update({ coming_soon: false })
    .eq('id', locationId)

  return NextResponse.json({ success: true, leaseId })
}
