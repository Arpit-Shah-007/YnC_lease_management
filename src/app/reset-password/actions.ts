'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function resetPasswordAction(_: unknown, formData: FormData) {
  const password = formData.get('password')?.toString() ?? ''
  const confirm  = formData.get('confirm')?.toString() ?? ''

  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm)  return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: 'Link expired or already used. Request a new reset email.' }

  await supabase.auth.signOut()
  redirect('/login?reset=1')
}
