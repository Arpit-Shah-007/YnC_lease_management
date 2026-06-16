import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
