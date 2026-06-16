'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createToken, verifyPassword, AUTH_COOKIE, type Role } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function loginAction(_: unknown, formData: FormData) {
  const email    = formData.get('email')?.toString().toLowerCase().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  let role: Role | null = null

  // 1. Try app_users table (Supabase)
  try {
    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from('app_users')
      .select('password_hash, password_salt, role')
      .eq('email', email)
      .maybeSingle()

    if (user) {
      const ok = await verifyPassword(password, user.password_hash, user.password_salt)
      if (ok) role = user.role as Role
    }
  } catch {
    // table doesn't exist yet — fall through to env-var fallback
  }

  // 2. Env-var fallback (bootstrapping before any users exist in DB)
  if (!role) {
    if (
      process.env.AUTH_ADMIN_EMAIL &&
      email === process.env.AUTH_ADMIN_EMAIL.toLowerCase() &&
      password === process.env.AUTH_ADMIN_PASSWORD
    ) {
      role = 'admin'
    } else if (
      process.env.AUTH_USER_EMAIL &&
      email === process.env.AUTH_USER_EMAIL.toLowerCase() &&
      password === process.env.AUTH_USER_PASSWORD
    ) {
      role = 'user'
    }
  }

  if (!role) {
    return { error: 'Invalid email or password.' }
  }

  const token = await createToken(role)
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE)
  redirect('/login')
}
