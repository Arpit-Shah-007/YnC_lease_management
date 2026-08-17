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
    // Fallback for links missing the leaseId param. Uses a JSONB containment filter so
    // Postgres locates the owning row, instead of reading lease_files for every lease.
    const { data: leases } = await supabase
      .from('leases')
      .select('lease_files')
      .contains('lease_files', [{ id }])
      .limit(1)

    const files = (leases?.[0]?.lease_files ?? []) as Array<{ id: string; storage_path: string }>
    storagePath = files.find(f => f.id === id)?.storage_path
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
