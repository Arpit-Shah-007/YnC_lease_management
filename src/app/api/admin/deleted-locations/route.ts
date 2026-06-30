import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('deleted_locations')
    .select('id, original_id, deleted_at, expires_at, snapshot')
    .gt('expires_at', new Date().toISOString())
    .order('deleted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let body: { id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()

  // Fetch the deleted record
  const { data: deleted, error: fetchErr } = await supabase
    .from('deleted_locations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !deleted) {
    return NextResponse.json({ error: 'Record not found in recycle bin' }, { status: 404 })
  }

  if (new Date(deleted.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This record has expired and cannot be restored' }, { status: 410 })
  }

  const snap = deleted.snapshot as {
    location: Record<string, unknown>
    lease: Record<string, unknown> | null
  }

  // Check for slug conflict
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', snap.location.slug as string)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `A location with slug "${snap.location.slug}" already exists. Rename or delete it first.` },
      { status: 409 }
    )
  }

  // Restore location (includes lease_id pointer — no FK constraint so order doesn't matter)
  const { error: locErr } = await supabase.from('locations').insert(snap.location)
  if (locErr) {
    return NextResponse.json({ error: 'Failed to restore location: ' + locErr.message }, { status: 500 })
  }

  // Restore lease (all sub-data embedded as JSONB)
  if (snap.lease) {
    const { error: leaseErr } = await supabase.from('leases').insert(snap.lease)
    if (leaseErr) {
      await supabase.from('locations').delete().eq('id', snap.location.id as string)
      return NextResponse.json({ error: 'Failed to restore lease: ' + leaseErr.message }, { status: 500 })
    }
  }

  // Remove from recycle bin
  await supabase.from('deleted_locations').delete().eq('id', id)

  return NextResponse.json({ success: true, slug: snap.location.slug })
}

export async function DELETE(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()

  const { error } = await supabase.from('deleted_locations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
