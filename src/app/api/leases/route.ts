import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('locationId')

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      cam_line_items(*),
      rent_schedule(*),
      critical_dates(*),
      clauses(*)
    `)
    .eq('location_id', locationId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
