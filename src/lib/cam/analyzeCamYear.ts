import type { SupabaseClient } from '@supabase/supabase-js'
import { compareCamDocuments } from '@/lib/extract/camComparator'
import { findClause, parseListItems, computeCamCapPct, findAnnualRentForYear } from '@/lib/camAudit'
import type { CamDocument, CamYearVerdict, CamLineItem, Lease } from '@/types/database'

export type AnalyzeResult =
  | { ok: true; verdict: CamYearVerdict }
  | { ok: false; error: string }

// Runs (or re-runs) the AI comparison for one CAM year on a lease, and persists the result.
// Requires both an 'estimate' and a 'reconciliation' document to already be uploaded for that year.
export async function analyzeCamYear(
  supabase: SupabaseClient,
  leaseId: string,
  year: number
): Promise<AnalyzeResult> {
  const { data: lease, error: fetchError } = await supabase
    .from('leases')
    .select('cam_documents, cam_year_verdicts, cam_line_items, clauses, rent_schedule')
    .eq('id', leaseId)
    .single()

  if (fetchError || !lease) {
    return { ok: false, error: 'Lease not found' }
  }

  const documents = (lease.cam_documents ?? []) as CamDocument[]
  const estimateDoc = documents.find(d => d.year === year && d.doc_type === 'estimate')
  const reconciliationDoc = documents.find(d => d.year === year && d.doc_type === 'reconciliation')

  if (!estimateDoc || !reconciliationDoc) {
    return { ok: false, error: 'Both an estimate and a reconciliation document are required for this year' }
  }

  const [estimateFile, reconciliationFile] = await Promise.all([
    supabase.storage.from(estimateDoc.storage_bucket).download(estimateDoc.storage_path),
    supabase.storage.from(reconciliationDoc.storage_bucket).download(reconciliationDoc.storage_path),
  ])

  if (estimateFile.error || !estimateFile.data) {
    return { ok: false, error: `Failed to read estimate document: ${estimateFile.error?.message ?? 'unknown error'}` }
  }
  if (reconciliationFile.error || !reconciliationFile.data) {
    return { ok: false, error: `Failed to read reconciliation document: ${reconciliationFile.error?.message ?? 'unknown error'}` }
  }

  const clauses = (lease.clauses ?? []) as Lease['clauses']
  const rentSchedule = (lease.rent_schedule ?? []) as Lease['rent_schedule']

  const capPct = computeCamCapPct(clauses)
  const annualRent = findAnnualRentForYear(rentSchedule, year)
  const capAmount = annualRent != null ? annualRent * capPct / 100 : null

  const permittedClause = findClause(clauses, 'cam_permitted', 'permitted in cam', 'cam inclusions', 'cam inclusion')
  const excludedClause = findClause(clauses, 'cam_excluded', 'excluded from cam', 'cam exclusions', 'cam exclusion', 'cam_exclusion')
  const permittedItems = permittedClause ? parseListItems(permittedClause.content) : []
  const excludedItems = excludedClause ? parseListItems(excludedClause.content) : []

  let comparison
  try {
    comparison = await compareCamDocuments({
      estimatePdf: Buffer.from(await estimateFile.data.arrayBuffer()),
      reconciliationPdf: Buffer.from(await reconciliationFile.data.arrayBuffer()),
      capPct,
      capAmount,
      permittedItems,
      excludedItems,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'AI comparison failed' }
  }

  const verdictEntry: CamYearVerdict = {
    year,
    verdict: comparison.verdict,
    actual_total: comparison.actual_total,
    estimate_total: comparison.estimate_total,
    cap_amount: capAmount,
    explanation: comparison.explanation,
    flagged_items: comparison.flagged_items,
    computed_at: new Date().toISOString(),
  }

  const existingVerdicts = (lease.cam_year_verdicts ?? []) as CamYearVerdict[]
  const updatedVerdicts = [...existingVerdicts.filter(v => v.year !== year), verdictEntry]

  const existingLineItems = (lease.cam_line_items ?? []) as CamLineItem[]
  const updatedLineItems: CamLineItem[] = [
    ...existingLineItems.filter(item => item.year !== year),
    ...(comparison.actual_total != null ? [{
      id: crypto.randomUUID(),
      year,
      category: 'CAM Reconciliation (AI-extracted)',
      landlord_billed: comparison.actual_total,
      tenant_share: comparison.actual_total,
      notes: 'Extracted automatically from the uploaded reconciliation document.',
    }] : []),
  ]

  const { error: updateError } = await supabase
    .from('leases')
    .update({ cam_year_verdicts: updatedVerdicts, cam_line_items: updatedLineItems })
    .eq('id', leaseId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  return { ok: true, verdict: verdictEntry }
}
