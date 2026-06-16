import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login')) {
    const token = request.cookies.get(AUTH_COOKIE)?.value ?? ''
    const valid = token ? await verifyToken(token) : null
    if (valid) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value ?? ''
  const valid = token ? await verifyToken(token) : null

  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
}
