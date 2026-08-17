import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { analyzeCamYear } from '@/lib/cam/analyzeCamYear'
import type { CamDocument, CamDocType } from '@/types/database'
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
  const leaseId = formData.get('leaseId') as string | null
  const yearRaw = formData.get('year') as string | null
  const docType = formData.get('docType') as CamDocType | null

  if (!file || !leaseId || !yearRaw || !docType) {
    return NextResponse.json({ error: 'file, leaseId, year and docType are required' }, { status: 400 })
  }
  if (docType !== 'estimate' && docType !== 'reconciliation') {
    return NextResponse.json({ error: 'docType must be "estimate" or "reconciliation"' }, { status: 400 })
  }
  const year = parseInt(yearRaw, 10)
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: 'year must be an integer' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: lease, error: fetchError } = await supabase
    .from('leases')
    .select('cam_documents')
    .eq('id', leaseId)
    .single()

  if (fetchError || !lease) {
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  }

  const existingDocs = (lease.cam_documents ?? []) as CamDocument[]
  const priorDoc = existingDocs.find(d => d.year === year && d.doc_type === docType)

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `cam/${leaseId}/${docType}-${year}-${Date.now()}_${safeFileName}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('leases')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const newEntry: CamDocument = {
    id: crypto.randomUUID(),
    year,
    doc_type: docType,
    file_name: file.name,
    storage_bucket: 'leases',
    storage_path: storagePath,
    file_size_bytes: file.size,
    uploaded_at: new Date().toISOString(),
  }

  const updatedDocs = [...existingDocs.filter(d => !(d.year === year && d.doc_type === docType)), newEntry]

  const { error: updateError } = await supabase
    .from('leases')
    .update({ cam_documents: updatedDocs })
    .eq('id', leaseId)

  if (updateError) {
    await supabase.storage.from('leases').remove([storagePath])
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Replacing an existing document removes its old file from storage (best-effort — the
  // DB update above already succeeded, so a cleanup failure here shouldn't fail the request).
  if (priorDoc) {
    await supabase.storage.from('leases').remove([priorDoc.storage_path])
  }

  const otherType: CamDocType = docType === 'estimate' ? 'reconciliation' : 'estimate'
  const hasPair = updatedDocs.some(d => d.year === year && d.doc_type === otherType)

  if (!hasPair) {
    return NextResponse.json({ success: true, document: newEntry, verdict: null })
  }

  const analysis = await analyzeCamYear(supabase, leaseId, year)
  if (!analysis.ok) {
    return NextResponse.json({ success: true, document: newEntry, verdict: null, analysisError: analysis.error })
  }

  return NextResponse.json({ success: true, document: newEntry, verdict: analysis.verdict })
}
