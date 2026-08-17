import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { Role } from '@/lib/auth'

export type SessionUser = {
  /** app_users.id, which matches the Supabase Auth user id. */
  id: string
  email: string
  role: Role
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('app_users')
    .select('id, role')
    .eq('email', user.email)
    .maybeSingle()

  if (!data) return null
  if (data.role !== 'admin' && data.role !== 'user') return null

  return { id: data.id, email: user.email, role: data.role as Role }
}

export async function getRole(): Promise<Role | null> {
  return (await getCurrentUser())?.role ?? null
}

export async function requireAdmin(): Promise<NextResponse | null> {
  const role = await getRole()
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
