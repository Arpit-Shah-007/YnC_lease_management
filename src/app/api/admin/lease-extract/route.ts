import { extractLease } from '@/lib/extract/leaseExtractor'
import { requireAdmin } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  try {
    const extraction = await extractLease(fileBuffer)
    return NextResponse.json({ extraction })
  } catch (err) {
    return NextResponse.json({
      error: `AI extraction failed: ${err instanceof Error ? err.message : 'check GROQ_API_KEY'}`,
    }, { status: 500 })
  }
}
