import Groq from 'groq-sdk'
import type { LeaseExtractionResult } from '@/types/database'

import pdfParse from 'pdf-parse'

const EXTRACTION_PROMPT = `You are a commercial lease abstraction specialist. Extract data from this lease document and return ONLY a valid JSON object matching the schema below. Use null for any field you cannot find. All dates must be ISO format (YYYY-MM-DD). All monetary amounts must be plain numbers (no $ signs, no commas). base_rent_monthly, cam_estimated_monthly, security_deposit are monthly figures.

Schema:
{
  "lessee": string | null,
  "lessor": string | null,
  "possession_date": string | null,
  "commencement_date": string | null,
  "expiry_date": string | null,
  "execution_date": string | null,
  "rent_commencement_date": string | null,
  "original_commencement_date": string | null,
  "term_type": string | null,
  "rent_structure": string | null,
  "term_length_months": number | null,
  "square_footage": number | null,
  "area_unit": string | null,
  "space_type": string | null,
  "base_rent_monthly": number | null,
  "cam_estimated_monthly": number | null,
  "pro_rata_share": number | null,   // as a percentage, e.g. 10.5 for a 10.5% share — never a fraction like 0.105
  "security_deposit": number | null,
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

Fields guide:
- rent_structure: e.g. "NNN", "NN", "Gross", "Modified Gross", "Ground Lease"
- term_type: e.g. "Fixed", "Month-to-Month"
- space_type: e.g. "Retail", "Restaurant", "Pad Site", "Inline"
- area_unit: "SF" or "Acres"
- execution_date: date lease was signed/executed
- rent_commencement_date: date rent payments first due (may differ from commencement)
- original_commencement_date: first commencement date if lease was amended or assigned
- security_deposit: total deposit amount (not monthly)
For clauses, extract all notable provisions: assignment, subletting, HVAC, CAM caps, renewal options, termination rights, holdover, insurance, exclusives, co-tenancy, and any unusual terms.
For critical_dates, include: expiry, all option exercise deadlines, notice windows, rent step dates.
Return ONLY the JSON object. No explanation, no markdown fences.`

export async function extractLease(pdfBuffer: Buffer): Promise<LeaseExtractionResult> {
  const { text: pdfText } = await pdfParse(pdfBuffer)

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: 'You are a commercial lease abstraction specialist. Return ONLY valid JSON, no markdown fences, no explanation.',
      },
      {
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\n---\nLEASE DOCUMENT TEXT:\n${pdfText}`,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content ?? '{}'
  try {
    return JSON.parse(text.trim()) as LeaseExtractionResult
  } catch {
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`)
  }
}
