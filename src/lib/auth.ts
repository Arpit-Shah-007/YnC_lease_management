export type Role = 'admin' | 'user'

export const AUTH_COOKIE = 'yandc_auth'

// ── Password hashing via PBKDF2 (Web Crypto — no package dependency) ──

async function pbkdf2(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 },
    key,
    256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomUUID()
  const hash = await pbkdf2(password, salt)
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computed = await pbkdf2(password, salt)
  return computed === hash
}

// ── HMAC session tokens ────────────────────────────────────────────────

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function createToken(role: Role): Promise<string> {
  const secret = process.env.AUTH_SECRET!
  const payload = btoa(JSON.stringify({ role }))
  const sig = await hmacSign(payload, secret)
  return `${payload}.${sig}`
}

export async function verifyToken(token: string): Promise<Role | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret || !token) return null
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacSign(payload, secret)
  if (expected !== sig) return null
  try {
    const { role } = JSON.parse(atob(payload))
    return role === 'admin' || role === 'user' ? (role as Role) : null
  } catch {
    return null
  }
}
