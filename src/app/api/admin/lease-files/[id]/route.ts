import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const leaseId = searchParams.get('leaseId')
  if (!leaseId) return NextResponse.json({ error: 'leaseId is required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: lease, error: fetchError } = await supabase
    .from('leases')
    .select('lease_files')
    .eq('id', leaseId)
    .single()

  if (fetchError || !lease) {
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  }

  const files = (lease.lease_files ?? []) as Array<{ id: string; storage_path: string }>
  const fileEntry = files.find(f => f.id === id)

  if (!fileEntry) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { error: storageError } = await supabase.storage
    .from('leases')
    .remove([fileEntry.storage_path])

  if (storageError) {
    return NextResponse.json({ error: `Storage delete failed: ${storageError.message}` }, { status: 500 })
  }

  const { error: dbError } = await supabase
    .from('leases')
    .update({ lease_files: files.filter(f => f.id !== id) })
    .eq('id', leaseId)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
