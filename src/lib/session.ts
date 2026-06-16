import { cookies } from 'next/headers'
import { verifyToken, AUTH_COOKIE, type Role } from '@/lib/auth'

export async function getRole(): Promise<Role | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  return token ? verifyToken(token) : null
}
