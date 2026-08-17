import { createAdminClient } from '@/lib/supabase/admin'
import { getRole } from '@/lib/session'
import type { CamDocument } from '@/types/database'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getRole()
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const leaseId = searchParams.get('leaseId')
  if (!leaseId) {
    return NextResponse.json({ error: 'leaseId is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: lease } = await supabase
    .from('leases')
    .select('cam_documents')
    .eq('id', leaseId)
    .single()

  const documents = (lease?.cam_documents ?? []) as CamDocument[]
  const entry = documents.find(d => d.id === id)

  if (!entry) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(entry.storage_bucket)
    .createSignedUrl(entry.storage_path, 60)

  if (signError || !signed) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
