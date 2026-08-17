import Groq from 'groq-sdk'
import pdfParse from 'pdf-parse'
import type { CamVerdict } from '@/types/database'

export type CamComparisonResult = {
  actual_total: number | null
  estimate_total: number | null
  verdict: CamVerdict
  explanation: string
  flagged_items: string[]
}

const COMPARISON_PROMPT = `You are a commercial lease CAM (Common Area Maintenance) audit specialist. You are given the text of two documents for the same CAM year — a landlord's CAM ESTIMATE (budgeted) and the corresponding CAM RECONCILIATION (actual, final) — plus the relevant lease terms. Compare the actual reconciliation against the lease's CAM cap and permitted/excluded expense categories, and decide a verdict.

Lease CAM terms:
- CAM cap: {CAP_PCT}% of annual fixed rent for the applicable lease year (cap dollar amount: {CAP_AMOUNT})
- Permitted CAM categories per lease: {PERMITTED}
- Excluded from CAM per lease: {EXCLUDED}

Return ONLY a valid JSON object matching this schema, no markdown fences, no explanation outside the JSON:
{
  "actual_total": number | null,   // total tenant-share CAM amount actually billed, from the reconciliation document
  "estimate_total": number | null, // total estimated CAM amount, from the estimate document (reference only)
  "verdict": "ok" | "high" | "low",
  "explanation": string,           // 1-3 sentences explaining the verdict in plain language
  "flagged_items": string[]        // billed line items/categories that appear to violate the lease's excluded/permitted terms (empty array if none)
}

Verdict rules:
- "high": actual_total exceeds the lease's CAM cap amount, OR includes categories that the lease excludes from CAM.
- "low": actual_total is unusually far below the estimate (e.g. more than ~30% under) with no clear explanation — worth double-checking nothing was missed, OR too little detail to bill confidently.
- "ok": actual_total is within the cap and consistent with permitted categories.

If a total can't be determined from the text, use null for that field but still return your best-effort verdict and explanation based on what is available.`

export async function compareCamDocuments(params: {
  reconciliationPdf: Buffer
  estimatePdf: Buffer
  capPct: number
  capAmount: number | null
  permittedItems: string[]
  excludedItems: string[]
}): Promise<CamComparisonResult> {
  const [{ text: reconciliationText }, { text: estimateText }] = await Promise.all([
    pdfParse(params.reconciliationPdf),
    pdfParse(params.estimatePdf),
  ])

  const prompt = COMPARISON_PROMPT
    .replace('{CAP_PCT}', String(params.capPct))
    .replace('{CAP_AMOUNT}', params.capAmount != null ? String(params.capAmount) : 'unknown')
    .replace('{PERMITTED}', params.permittedItems.length ? params.permittedItems.join(', ') : 'not specified in lease')
    .replace('{EXCLUDED}', params.excludedItems.length ? params.excludedItems.join(', ') : 'not specified in lease')

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'You are a commercial lease CAM audit specialist. Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.',
      },
      {
        role: 'user',
        content: `${prompt}\n\n---\nCAM ESTIMATE DOCUMENT TEXT:\n${estimateText}\n\n---\nCAM RECONCILIATION DOCUMENT TEXT:\n${reconciliationText}`,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content ?? '{}'
  let parsed: CamComparisonResult
  try {
    parsed = JSON.parse(text.trim()) as CamComparisonResult
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`)
  }

  if (!['ok', 'high', 'low'].includes(parsed.verdict)) {
    throw new Error(`AI returned an invalid verdict: ${String(parsed.verdict)}`)
  }

  return {
    actual_total: parsed.actual_total ?? null,
    estimate_total: parsed.estimate_total ?? null,
    verdict: parsed.verdict,
    explanation: parsed.explanation ?? '',
    flagged_items: Array.isArray(parsed.flagged_items) ? parsed.flagged_items : [],
  }
}
