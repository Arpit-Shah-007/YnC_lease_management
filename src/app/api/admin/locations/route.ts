import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

function buildSlug(brand: string, storeNumber: string | null): string {
  const suffix = storeNumber
    ? storeNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    : Math.random().toString(36).slice(2, 7)
  return `${brand.toLowerCase()}-${suffix}`
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { brand, store_number, display_name, address, city, state, zip, maps_url } =
    body as Record<string, string | null>

  if (!brand || !display_name) {
    return NextResponse.json({ error: 'brand and display_name are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('locations')
    .insert({
      slug: buildSlug(brand, store_number),
      brand,
      store_number: store_number ?? null,
      display_name,
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
      maps_url: maps_url ?? null,
      coming_soon: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()

  // Fetch everything before deleting so we can snapshot it
  const { data: location, error: locErr } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (locErr || !location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  // Lease row now contains all sub-data as JSONB — one query suffices
  const { data: lease } = await supabase
    .from('leases')
    .select('*')
    .eq('location_id', id)
    .maybeSingle()

  const snapshot = {
    location,
    lease: lease ?? null,
  }

  // Save snapshot to recycle bin
  const { error: snapshotErr } = await supabase
    .from('deleted_locations')
    .insert({ original_id: id, snapshot })

  if (snapshotErr) {
    return NextResponse.json(
      { error: 'Failed to create backup: ' + snapshotErr.message },
      { status: 500 }
    )
  }

  // Hard delete — CASCADE on leases.location_id removes the lease row
  const { error: deleteErr } = await supabase.from('locations').delete().eq('id', id)
  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
