import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/auth'

export async function getRole(): Promise<Role | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('app_users')
    .select('role')
    .eq('email', user.email)
    .maybeSingle()

  if (!data) return null
  return data.role === 'admin' || data.role === 'user' ? (data.role as Role) : null
}
