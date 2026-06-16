import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, name, password, role } = body as Record<string, string>

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }
  if (role !== 'admin' && role !== 'user') {
    return NextResponse.json({ error: 'role must be admin or user' }, { status: 400 })
  }

  const { hash, salt } = await hashPassword(password)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_users')
    .insert({ email: email.toLowerCase().trim(), name: name || null, password_hash: hash, password_salt: salt, role })
    .select('id, email, name, role, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('app_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
