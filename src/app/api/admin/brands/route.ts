import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function GET() {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

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
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

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

export async function DELETE(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .eq('brand', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${count} location${count > 1 ? 's' : ''} still reference this brand. Remove them first.` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
