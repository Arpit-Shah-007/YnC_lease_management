import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/session'
import { analyzeCamYear } from '@/lib/cam/analyzeCamYear'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let body: { leaseId?: string; year?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { leaseId, year } = body
  if (!leaseId || !Number.isInteger(year)) {
    return NextResponse.json({ error: 'leaseId and year are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const result = await analyzeCamYear(supabase, leaseId, year as number)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  return NextResponse.json({ success: true, verdict: result.verdict })
}
