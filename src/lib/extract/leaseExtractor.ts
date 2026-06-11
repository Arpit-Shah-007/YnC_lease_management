import Anthropic from '@anthropic-ai/sdk'
import type { LeaseExtractionResult } from '@/types/database'

const EXTRACTION_PROMPT = `You are a commercial lease abstraction specialist. Extract data from this lease PDF and return ONLY a valid JSON object matching the schema below. Use null for any field you cannot find. All dates must be ISO format (YYYY-MM-DD). All monetary amounts must be monthly figures as plain numbers (no $ signs, no commas).

Schema:
{
  "lessee": string | null,
  "lessor": string | null,
  "possession_date": string | null,
  "commencement_date": string | null,
  "expiry_date": string | null,
  "term_type": string | null,
  "square_footage": number | null,
  "base_rent_monthly": number | null,
  "cam_estimated_monthly": number | null,
  "pro_rata_share": number | null,
  "rent_schedule": [{
    "period_label": string,
    "period_start": string | null,
    "period_end": string | null,
    "base_rent_monthly": number | null,
    "cam_estimated_monthly": number | null,
    "notes": string | null
  }],
  "critical_dates": [{
    "event_type": string,
    "event_date": string | null,
    "notice_required_days": number | null,
    "notes": string | null
  }],
  "clauses": [{
    "clause_type": string,
    "title": string,
    "content": string,
    "page_reference": string | null
  }],
  "cam_line_items": [{
    "year": number,
    "category": string,
    "landlord_billed": number | null,
    "tenant_share": number | null,
    "notes": string | null
  }]
}

For clauses, extract all notable provisions: assignment, subletting, HVAC, CAM caps, renewal options, termination rights, holdover, insurance, exclusives, co-tenancy, and any unusual terms.
For critical_dates, include: expiry, all option exercise deadlines, notice windows, rent step dates.
Return ONLY the JSON object. No explanation, no markdown fences.`

export async function extractLease(pdfBase64: string): Promise<LeaseExtractionResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  })

  const firstBlock = message.content[0]
  const text = firstBlock?.type === 'text' ? firstBlock.text : '{}'
  try {
    return JSON.parse(text.trim()) as LeaseExtractionResult
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`)
  }
}
