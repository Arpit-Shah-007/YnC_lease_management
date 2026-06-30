import { createAdminClient } from '@/lib/supabase/admin'
import { extractLease } from '@/lib/extract/leaseExtractor'
import type { LeaseExtractionResult } from '@/types/database'
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

  // If caller already has reviewed data (from /api/admin/lease-extract step), use it
  // Otherwise run AI extraction now (backward-compatible path)
  const reviewedRaw = formData.get('reviewedData') as string | null
  let extraction: LeaseExtractionResult
  if (reviewedRaw) {
    try {
      extraction = JSON.parse(reviewedRaw) as LeaseExtractionResult
    } catch {
      await supabase.storage.from('leases').remove([storagePath])
      return NextResponse.json({ error: 'reviewedData is not valid JSON' }, { status: 400 })
    }
  } else {
    try {
      extraction = await extractLease(fileBuffer)
    } catch (err) {
      await supabase.storage.from('leases').remove([storagePath])
      return NextResponse.json({
        error: `AI extraction failed: ${err instanceof Error ? err.message : 'check GROQ_API_KEY'}`,
      }, { status: 500 })
    }
  }

  // Build embedded JSONB arrays from extraction result
  const rentSchedule = extraction.rent_schedule.map((r, i) => ({
    id: crypto.randomUUID(),
    period_label: r.period_label,
    period_start: r.period_start,
    period_end: r.period_end,
    base_rent_monthly: r.base_rent_monthly,
    base_rent_annual: null as number | null,
    cam_estimated_monthly: r.cam_estimated_monthly,
    total_monthly: null as number | null,
    notes: r.notes,
    sort_order: i,
  }))

  const criticalDates = extraction.critical_dates.map(d => ({
    id: crypto.randomUUID(),
    event_type: d.event_type,
    event_date: d.event_date,
    notice_required_days: d.notice_required_days,
    notes: d.notes,
  }))

  const clauses = extraction.clauses.map(c => ({
    id: crypto.randomUUID(),
    clause_type: c.clause_type,
    title: c.title,
    content: c.content,
    page_reference: c.page_reference,
    created_at: new Date().toISOString(),
  }))

  const camLineItems = extraction.cam_line_items.map(c => ({
    id: crypto.randomUUID(),
    year: c.year,
    category: c.category,
    landlord_billed: c.landlord_billed,
    tenant_share: c.tenant_share,
    notes: c.notes,
  }))

  const newFileEntry = {
    id: crypto.randomUUID(),
    file_name: file.name,
    storage_bucket: 'leases',
    storage_path: storagePath,
    file_size_bytes: file.size,
    mime_type: 'application/pdf',
    uploaded_at: new Date().toISOString(),
  }

  // Fetch existing files before upsert so we can preserve them
  const { data: existingLease } = await supabase
    .from('leases')
    .select('lease_files')
    .eq('location_id', locationId)
    .maybeSingle()

  const existingFiles = (existingLease?.lease_files ?? []) as typeof newFileEntry[]

  // Upsert lease — all data in one row
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
        execution_date: extraction.execution_date ?? null,
        rent_commencement_date: extraction.rent_commencement_date ?? null,
        original_commencement_date: extraction.original_commencement_date ?? null,
        term_type: extraction.term_type,
        rent_structure: extraction.rent_structure ?? null,
        term_length_months: extraction.term_length_months ?? null,
        square_footage: extraction.square_footage,
        area_unit: extraction.area_unit ?? null,
        space_type: extraction.space_type ?? null,
        base_rent_monthly: extraction.base_rent_monthly,
        cam_estimated_monthly: extraction.cam_estimated_monthly,
        pro_rata_share: extraction.pro_rata_share,
        security_deposit: extraction.security_deposit ?? null,
        status: 'active',
        extracted_at: new Date().toISOString(),
        rent_schedule: rentSchedule,
        critical_dates: criticalDates,
        clauses,
        cam_line_items: camLineItems,
        lease_files: [newFileEntry, ...existingFiles],
      },
      { onConflict: 'location_id' }
    )
    .select()
    .single()

  if (leaseError || !lease) {
    await supabase.storage.from('leases').remove([storagePath])
    return NextResponse.json({ error: leaseError?.message ?? 'Failed to save lease' }, { status: 500 })
  }

  // Keep locations.lease_id in sync
  await supabase.from('locations').update({ lease_id: lease.id }).eq('id', locationId)

  return NextResponse.json({ success: true, leaseId: lease.id, fileId: newFileEntry.id })
}
