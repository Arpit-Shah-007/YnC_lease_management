import { createAdminClient } from '@/lib/supabase/admin'
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

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
  }
  if (role !== 'admin' && role !== 'user') {
    return NextResponse.json({ error: 'role must be admin or user' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create in Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Insert into app_users with the auth user's UUID and role
  const { data, error: dbError } = await admin
    .from('app_users')
    .insert({
      id:            authData.user.id,
      email:         authData.user.email,
      name:          name.trim(),
      role,
      password_hash: '',
      password_salt: '',
    })
    .select('id, email, name, role, created_at')
    .single()

  if (dbError) {
    // Roll back the auth user if the DB insert fails
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const admin = createAdminClient()

  // Delete from Supabase Auth (no-op if the ID doesn't match an auth user)
  await admin.auth.admin.deleteUser(id)

  // Delete from app_users
  const { error } = await admin.from('app_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
