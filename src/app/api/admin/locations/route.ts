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
