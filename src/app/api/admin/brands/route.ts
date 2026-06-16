import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, display_name, color } = body as Record<string, string>

  if (!id || !display_name) {
    return NextResponse.json({ error: 'id and display_name are required' }, { status: 400 })
  }

  if (!/^[a-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: 'id must be lowercase letters and numbers only' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('brands')
    .insert({ id, display_name, color: color ?? '#555555' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
