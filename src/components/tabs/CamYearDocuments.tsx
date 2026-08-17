'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeaseWithRelations, CamDocument, CamDocType, CamYearVerdict } from '@/types/database'
import { buildCamSummary, type CamSummary, type CamYearRow } from '@/lib/camAudit'
import { fmtMoney } from '@/lib/format'
import styles from './CamYearDocuments.module.css'

type Props = {
  lease: LeaseWithRelations
  isAdmin: boolean
}

const VERDICT_LABEL: Record<string, string> = { ok: 'OK', high: 'HIGH', low: 'LOW' }

function fmtSigned(n: number | null): string {
  if (n == null) return '—'
  return (n > 0 ? '+' : '') + fmtMoney(n)
}

export default function CamYearDocuments({ lease, isAdmin }: Props) {
  const [documents, setDocuments] = useState<CamDocument[]>(lease.cam_documents ?? [])
  const [verdicts, setVerdicts] = useState<CamYearVerdict[]>(lease.cam_year_verdicts ?? [])
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [retryingYear, setRetryingYear] = useState<number | null>(null)
  const [expandedYear, setExpandedYear] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAddYear, setShowAddYear] = useState(false)
  const [newYear, setNewYear] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingUpload = useRef<{ year: number; docType: CamDocType } | null>(null)
  const router = useRouter()

  // Derived from local state so the summary updates the moment an upload or re-run lands.
  // router.refresh() then pulls the persisted line items in behind it.
  const summary = buildCamSummary({
    ...lease,
    cam_documents: documents,
    cam_year_verdicts: verdicts,
  })

  function triggerUpload(year: number, docType: CamDocType) {
    pendingUpload.current = { year, docType }
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const pending = pendingUpload.current
    if (!file || !pending) return
    setError(null)
    const key = `${pending.year}-${pending.docType}`
    setUploadingKey(key)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('leaseId', lease.id)
    fd.append('year', String(pending.year))
    fd.append('docType', pending.docType)

    try {
      const res = await fetch('/api/admin/cam-documents/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Upload failed')
      } else {
        setDocuments(prev => [
          ...prev.filter(d => !(d.year === pending.year && d.doc_type === pending.docType)),
          json.document,
        ])
        if (json.verdict) {
          setVerdicts(prev => [...prev.filter(v => v.year !== pending.year), json.verdict])
          setExpandedYear(pending.year)
        }
        if (json.analysisError) {
          setError(`Document uploaded, but analysis failed: ${json.analysisError}`)
        }
        router.refresh()
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploadingKey(null)
      pendingUpload.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function runAnalysis(year: number) {
    setError(null)
    setRetryingYear(year)
    try {
      const res = await fetch('/api/admin/cam-documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId: lease.id, year }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Analysis failed')
      } else {
        setVerdicts(prev => [...prev.filter(v => v.year !== year), json.verdict])
        setExpandedYear(year)
        router.refresh()
      }
    } catch {
      setError('Analysis failed')
    } finally {
      setRetryingYear(null)
    }
  }

  function handleAddYear() {
    const year = parseInt(newYear, 10)
    if (!Number.isInteger(year)) return
    setShowAddYear(false)
    setNewYear('')
    triggerUpload(year, 'reconciliation')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>CAM Estimate vs. Reconciliation</h3>
        {isAdmin && (
          showAddYear ? (
            <div className={styles.addYearForm}>
              <input
                type="number"
                className={styles.yearInput}
                placeholder="Year"
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
                autoFocus
              />
              <button type="button" className={styles.addYearConfirm} onClick={handleAddYear}>Add</button>
              <button type="button" className={styles.addYearCancel} onClick={() => setShowAddYear(false)}>Cancel</button>
            </div>
          ) : (
            <button type="button" className={styles.addYearBtn} onClick={() => setShowAddYear(true)}>+ Add Year</button>
          )
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className={styles.hiddenInput}
        onChange={handleFileSelected}
      />

      {error && <p className={styles.errorMsg}>{error}</p>}

      {summary.rows.length === 0 ? (
        <p className={styles.empty}>
          No CAM documents uploaded yet. Add a year and upload the landlord&rsquo;s reconciliation to
          audit it against this lease&rsquo;s {summary.capPct}% cap.
        </p>
      ) : (
        <>
          <CamSummaryBar summary={summary} />

          <div className={styles.yearList}>
            {summary.rows.map(row => (
              <YearBlock
                key={row.year}
                row={row}
                leaseId={lease.id}
                documents={documents}
                isAdmin={isAdmin}
                expanded={expandedYear === row.year}
                onToggle={() => setExpandedYear(expandedYear === row.year ? null : row.year)}
                uploadingKey={uploadingKey}
                retrying={retryingYear === row.year}
                onUpload={triggerUpload}
                onAnalyse={() => runAnalysis(row.year)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Derived summary ────────────────────────────────────────────────

function CamSummaryBar({ summary }: { summary: CamSummary }) {
  const { analyzedCount, rows, totalBilled, totalCap, totalOverage, overCapCount, flaggedCount } = summary

  const headline = analyzedCount === 0
    ? 'Not yet audited'
    : totalOverage > 0
      ? `${fmtMoney(totalOverage)} billed over cap`
      : 'Within cap every audited year'

  return (
    <div className={styles.summary}>
      <div className={styles.summaryHead}>
        <div>
          <span className={styles.summaryLabel}>Audit Summary</span>
          <span
            className={`${styles.summaryHeadline} ${totalOverage > 0 ? styles.summaryBad : analyzedCount > 0 ? styles.summaryGood : ''}`}
          >
            {headline}
          </span>
        </div>
        <span className={styles.summaryMeta}>
          {analyzedCount} of {rows.length} {rows.length === 1 ? 'year' : 'years'} audited
          &middot; {summary.capPct}% cap
        </span>
      </div>

      <div className={styles.statRow}>
        <Stat label="Total Billed" value={fmtMoney(totalBilled)} />
        <Stat label="Total Cap" value={fmtMoney(totalCap)} />
        <Stat
          label="Over Cap"
          value={fmtMoney(totalOverage)}
          tone={totalOverage > 0 ? 'bad' : 'good'}
        />
        <Stat
          label="Years Over Cap"
          value={String(overCapCount)}
          tone={overCapCount > 0 ? 'bad' : 'good'}
        />
        <Stat
          label="Flagged Items"
          value={String(flaggedCount)}
          tone={flaggedCount > 0 ? 'bad' : 'good'}
        />
      </div>

      {summary.pendingYears.length > 0 && (
        <p className={styles.summaryNote}>
          Not yet audited: {summary.pendingYears.join(', ')}. Run the analysis to include{' '}
          {summary.pendingYears.length === 1 ? 'it' : 'them'}.
        </p>
      )}
      {summary.awaitingReconciliation.length > 0 && (
        <p className={styles.summaryNote}>
          Estimate only, awaiting reconciliation: {summary.awaitingReconciliation.join(', ')}.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${tone === 'bad' ? styles.statBad : tone === 'good' ? styles.statGood : ''}`}>
        {value}
      </span>
    </div>
  )
}

// ── One CAM year ───────────────────────────────────────────────────

function YearBlock({
  row, leaseId, documents, isAdmin, expanded, onToggle,
  uploadingKey, retrying, onUpload, onAnalyse,
}: {
  row: CamYearRow
  leaseId: string
  documents: CamDocument[]
  isAdmin: boolean
  expanded: boolean
  onToggle: () => void
  uploadingKey: string | null
  retrying: boolean
  onUpload: (year: number, docType: CamDocType) => void
  onAnalyse: () => void
}) {
  const estimate = documents.find(d => d.year === row.year && d.doc_type === 'estimate')
  const reconciliation = documents.find(d => d.year === row.year && d.doc_type === 'reconciliation')

  return (
    <div>
      <div className={styles.yearRow}>
        <span className={styles.yearLabel}>{row.year}</span>

        <DocCell
          doc={estimate}
          leaseId={leaseId}
          label="Estimate"
          isAdmin={isAdmin}
          uploading={uploadingKey === `${row.year}-estimate`}
          onUpload={() => onUpload(row.year, 'estimate')}
        />
        <DocCell
          doc={reconciliation}
          leaseId={leaseId}
          label="Reconciliation"
          isAdmin={isAdmin}
          uploading={uploadingKey === `${row.year}-reconciliation`}
          onUpload={() => onUpload(row.year, 'reconciliation')}
        />

        <div className={styles.verdictCell}>
          {row.verdict ? (
            <button
              type="button"
              className={`${styles.verdictBadge} ${styles[`verdict_${row.verdict}`]}`}
              onClick={onToggle}
              aria-expanded={expanded}
            >
              {VERDICT_LABEL[row.verdict]}
              {row.overage != null && row.overage > 0 && ` · ${fmtMoney(row.overage)} over`}
            </button>
          ) : row.hasReconciliation ? (
            <span className={styles.pendingText}>
              Not audited
              {isAdmin && (
                <button type="button" className={styles.retryBtn} onClick={onAnalyse} disabled={retrying}>
                  {retrying ? 'Analysing...' : 'Run analysis'}
                </button>
              )}
            </span>
          ) : (
            <span className={styles.pendingText}>Awaiting reconciliation</span>
          )}
        </div>
      </div>

      {expanded && row.verdict && (
        <div className={styles.explanation}>
          <p>{row.explanation}</p>

          <div className={styles.figures}>
            <span>Estimate: {fmtMoney(row.estimateTotal)}</span>
            <span>Actual: {fmtMoney(row.actualTotal)}</span>
            <span>Cap: {fmtMoney(row.capAmount)}</span>
            {row.estimateVariance != null && (
              <span>vs Estimate: {fmtSigned(row.estimateVariance)}</span>
            )}
            <span className={row.overage != null && row.overage > 0 ? styles.overBad : undefined}>
              Over cap: {row.overage != null ? fmtMoney(row.overage) : '—'}
            </span>
          </div>

          {row.estimateTotal == null && (
            <p className={styles.summaryNote}>
              No estimate on file for {row.year}, so this year was audited against the cap and the
              lease&rsquo;s CAM exclusions only.
            </p>
          )}

          {row.flaggedItems.length > 0 && (
            <ul className={styles.flaggedList}>
              {row.flaggedItems.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}

          {row.categories.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Landlord Total</th>
                    <th>Tenant Share</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {row.categories.map(item => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{fmtMoney(item.landlord_billed)}</td>
                      <td>{fmtMoney(item.tenant_share)}</td>
                      <td className={styles.noteCell}>{item.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && (
            <button type="button" className={styles.retryBtn} onClick={onAnalyse} disabled={retrying}>
              {retrying ? 'Re-analysing...' : 'Re-run analysis'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DocCell({ doc, leaseId, label, isAdmin, uploading, onUpload }: {
  doc: CamDocument | undefined
  leaseId: string
  label: string
  isAdmin: boolean
  uploading: boolean
  onUpload: () => void
}) {
  if (doc) {
    return (
      <div className={styles.docCell}>
        <a
          href={`/api/admin/cam-documents/${doc.id}/download?leaseId=${encodeURIComponent(leaseId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.docLink}
        >
          {label} &#10003;
        </a>
        {isAdmin && (
          <button type="button" className={styles.replaceBtn} onClick={onUpload} disabled={uploading}>
            {uploading ? '...' : 'Replace'}
          </button>
        )}
      </div>
    )
  }

  if (!isAdmin) {
    return <div className={styles.docCell}><span className={styles.docMissing}>&mdash;</span></div>
  }

  return (
    <div className={styles.docCell}>
      <button type="button" className={styles.uploadBtn} onClick={onUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : `Upload ${label}`}
      </button>
    </div>
  )
}
