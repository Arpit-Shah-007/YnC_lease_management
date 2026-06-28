'use server'

import { createClient } from '@/lib/supabase/server'

export async function forgotPasswordAction(_: unknown, formData: FormData) {
  const email = formData.get('email')?.toString().toLowerCase().trim() ?? ''
  if (!email) return { error: 'Email is required.' }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })

  // Always succeed — never reveal whether the email exists
  return { success: true }
}
