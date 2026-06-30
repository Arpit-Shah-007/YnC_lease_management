import { createAdminClient } from '@/lib/supabase/admin'
import { getRole } from '@/lib/session'
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

  const supabase = createAdminClient()
  let storagePath: string | undefined

  if (leaseId) {
    // Fast path: look up file in specific lease
    const { data: lease } = await supabase
      .from('leases')
      .select('lease_files')
      .eq('id', leaseId)
      .single()

    const files = (lease?.lease_files ?? []) as Array<{ id: string; storage_path: string }>
    storagePath = files.find(f => f.id === id)?.storage_path
  } else {
    // Fallback: search across all leases (for any links missing leaseId param)
    const { data: leases } = await supabase.from('leases').select('lease_files')
    for (const lease of leases ?? []) {
      const files = (lease.lease_files ?? []) as Array<{ id: string; storage_path: string }>
      const entry = files.find(f => f.id === id)
      if (entry) { storagePath = entry.storage_path; break }
    }
  }

  if (!storagePath) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('leases')
    .createSignedUrl(storagePath, 60)

  if (signError || !signed) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
