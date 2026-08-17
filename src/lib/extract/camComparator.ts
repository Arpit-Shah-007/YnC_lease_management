import Groq from 'groq-sdk'
import pdfParse from 'pdf-parse'
import type { CamVerdict } from '@/types/database'

/** One CAM expense category read off the reconciliation document. */
export type CamCategoryLine = {
  category: string
  landlord_total: number | null
  tenant_share: number | null
  /** True when the category appears to be one the lease excludes from CAM. */
  excluded: boolean
  note: string | null
}

export type CamComparisonResult = {
  actual_total: number | null
  estimate_total: number | null
  verdict: CamVerdict
  explanation: string
  flagged_items: string[]
  line_items: CamCategoryLine[]
}

const SCHEMA = `{
  "actual_total": number | null,    // total tenant-share CAM actually billed, from the reconciliation
  "estimate_total": number | null,  // total estimated tenant-share CAM; null if no estimate document was provided
  "verdict": "ok" | "high" | "low",
  "explanation": string,            // 1-3 sentences, plain language, cite the numbers you relied on
  "flagged_items": string[],        // billed categories that appear to breach the lease's exclusions, or other concerns
  "line_items": [                   // one entry per CAM expense category you can identify on the reconciliation
    {
      "category": string,
      "landlord_total": number | null,  // total pool cost for the category
      "tenant_share": number | null,    // this tenant's share of the category
      "excluded": boolean,              // true if the lease excludes this category from CAM
      "note": string | null             // short note only when something is worth flagging
    }
  ]
}`

function buildPrompt(params: {
  capPct: number
  capAmount: number | null
  permittedItems: string[]
  excludedItems: string[]
  hasEstimate: boolean
}): string {
  const capAmount = params.capAmount != null
    ? `$${params.capAmount.toFixed(2)}`
    : 'unknown (the rent schedule has no annual rent for this year)'

  return `You are a commercial lease CAM (Common Area Maintenance) audit specialist. You are given the text of a landlord's CAM RECONCILIATION (the actual, final year-end charges)${params.hasEstimate ? ' and the corresponding CAM ESTIMATE (the budgeted figure issued at the start of the year)' : ''}, plus the tenant's lease terms. Audit the actual charges against the lease and return a verdict.

Lease CAM terms:
- CAM cap: ${params.capPct}% of annual fixed rent for the applicable lease year (cap dollar amount: ${capAmount})
- Permitted CAM categories per lease: ${params.permittedItems.length ? params.permittedItems.join(', ') : 'not specified in lease'}
- Excluded from CAM per lease: ${params.excludedItems.length ? params.excludedItems.join(', ') : 'not specified in lease'}
${params.hasEstimate ? '' : '\nNo estimate document was provided, so set estimate_total to null and judge the actual charges against the cap and the lease exclusions alone. Do not invent an estimate.'}

Work in tenant-share dollars wherever the document distinguishes the landlord's total pool cost from this tenant's pro-rata share. If a figure is genuinely absent, use null rather than guessing.

Return ONLY a valid JSON object matching this schema, no markdown fences, no prose outside the JSON:
${SCHEMA}

Verdict rules:
- "high": actual_total exceeds the cap amount, OR the reconciliation bills categories the lease excludes from CAM. These are the recoverable overcharges, so be specific in flagged_items.
- "low": actual_total is far below${params.hasEstimate ? ' the estimate (roughly 30% or more under)' : ' what the cap would allow'} with no stated reason, or the document is too thin to verify the charges. Worth a second look rather than an overcharge.
- "ok": actual_total is within the cap and consistent with the permitted categories.

If the cap amount is unknown, judge on the lease exclusions and the document's internal consistency, and say so in the explanation.`
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[$,\s]/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function toLineItems(raw: unknown): CamCategoryLine[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry): CamCategoryLine[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const e = entry as Record<string, unknown>
    const category = typeof e.category === 'string' ? e.category.trim() : ''
    if (!category) return []
    return [{
      category,
      landlord_total: toNumber(e.landlord_total),
      tenant_share: toNumber(e.tenant_share),
      excluded: e.excluded === true,
      note: typeof e.note === 'string' && e.note.trim() ? e.note.trim() : null,
    }]
  })
}

// Strips ```json fences and any prose either side of the JSON object, which the model
// still emits occasionally despite being told not to.
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = (fenced ? fenced[1] : text).trim()
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  return start !== -1 && end > start ? body.slice(start, end + 1) : body
}

export async function compareCamDocuments(params: {
  reconciliationPdf: Buffer
  /** Optional: many landlords only ever issue a reconciliation. */
  estimatePdf?: Buffer | null
  capPct: number
  capAmount: number | null
  permittedItems: string[]
  excludedItems: string[]
}): Promise<CamComparisonResult> {
  const { text: reconciliationText } = await pdfParse(params.reconciliationPdf)
  const estimateText = params.estimatePdf
    ? (await pdfParse(params.estimatePdf)).text
    : null

  if (!reconciliationText.trim()) {
    throw new Error('No text could be read from the reconciliation PDF (it may be a scanned image)')
  }

  const prompt = buildPrompt({
    capPct: params.capPct,
    capAmount: params.capAmount,
    permittedItems: params.permittedItems,
    excludedItems: params.excludedItems,
    hasEstimate: estimateText != null,
  })

  const documents = [
    estimateText ? `---\nCAM ESTIMATE DOCUMENT TEXT:\n${estimateText}` : null,
    `---\nCAM RECONCILIATION DOCUMENT TEXT:\n${reconciliationText}`,
  ].filter(Boolean).join('\n\n')

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a commercial lease CAM audit specialist. Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.',
      },
      { role: 'user', content: `${prompt}\n\n${documents}` },
    ],
  })

  const text = completion.choices[0]?.message?.content ?? '{}'
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(extractJson(text)) as Record<string, unknown>
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`)
  }

  const verdict = parsed.verdict
  if (verdict !== 'ok' && verdict !== 'high' && verdict !== 'low') {
    throw new Error(`AI returned an invalid verdict: ${String(verdict)}`)
  }

  const lineItems = toLineItems(parsed.line_items)
  const flagged = Array.isArray(parsed.flagged_items)
    ? parsed.flagged_items.filter((f): f is string => typeof f === 'string' && f.trim() !== '')
    : []

  // An excluded category is an overcharge whether or not the model also listed it in
  // flagged_items, so make sure it surfaces either way.
  for (const item of lineItems) {
    if (item.excluded && !flagged.some(f => f.toLowerCase().includes(item.category.toLowerCase()))) {
      flagged.push(`${item.category} — excluded from CAM under this lease`)
    }
  }

  const actualTotal = toNumber(parsed.actual_total)
  const lineItemSum = lineItems.reduce<number | null>((sum, i) => (
    i.tenant_share != null ? (sum ?? 0) + i.tenant_share : sum
  ), null)

  return {
    // Fall back to the sum of the categories when no explicit total was stated.
    actual_total: actualTotal ?? lineItemSum,
    estimate_total: estimateText != null ? toNumber(parsed.estimate_total) : null,
    verdict,
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    flagged_items: flagged,
    line_items: lineItems,
  }
}
