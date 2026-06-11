import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const locationId = formData.get('locationId') as string | null
  const leaseId = formData.get('leaseId') as string | null

  if (!file || !locationId) {
    return NextResponse.json(
      { error: 'file and locationId are required' },
      { status: 400 }
    )
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const MAX_BYTES = 50 * 1024 * 1024 // 50 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 400 })
  }

  const supabase = await createClient()
  const storagePath = `${locationId}/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('leases')
    .upload(storagePath, bytes, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data, error: dbError } = await supabase
    .from('lease_files')
    .insert({
      lease_id: leaseId ?? null,
      location_id: locationId,
      file_name: file.name,
      storage_path: storagePath,
      file_size_bytes: file.size,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
