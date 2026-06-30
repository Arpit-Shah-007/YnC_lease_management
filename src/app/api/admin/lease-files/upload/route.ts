import { createAdminClient } from '@/lib/supabase/admin'
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
  const leaseId = formData.get('leaseId') as string | null
  const locationId = formData.get('locationId') as string | null

  if (!file || !leaseId || !locationId) {
    return NextResponse.json({ error: 'file, leaseId and locationId are required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${locationId}/${Date.now()}_${safeFileName}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('leases')
    .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
  }

  const { data: lease, error: fetchError } = await supabase
    .from('leases')
    .select('lease_files')
    .eq('id', leaseId)
    .single()

  if (fetchError || !lease) {
    await supabase.storage.from('leases').remove([storagePath])
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  }

  const newEntry = {
    id: crypto.randomUUID(),
    file_name: file.name,
    storage_bucket: 'leases',
    storage_path: storagePath,
    file_size_bytes: file.size,
    mime_type: 'application/pdf',
    uploaded_at: new Date().toISOString(),
  }

  const existingFiles = (lease.lease_files ?? []) as typeof newEntry[]

  const { error: updateError } = await supabase
    .from('leases')
    .update({ lease_files: [newEntry, ...existingFiles] })
    .eq('id', leaseId)

  if (updateError) {
    await supabase.storage.from('leases').remove([storagePath])
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, file: newEntry })
}
