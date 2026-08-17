'use client'

import { useRef, useState } from 'react'
import type { LeaseWithRelations, CamDocument, CamDocType, CamYearVerdict } from '@/types/database'
import styles from './CamYearDocuments.module.css'

type Props = {
  lease: LeaseWithRelations
  isAdmin: boolean
}

const VERDICT_LABEL: Record<string, string> = { ok: 'OK', high: 'HIGH', low: 'LOW' }

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

  const years = Array.from(new Set([
    ...documents.map(d => d.year),
    ...verdicts.map(v => v.year),
  ])).sort((a, b) => b - a)

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
        }
        if (json.analysisError) {
          setError(`Document uploaded, but analysis failed: ${json.analysisError}`)
        }
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploadingKey(null)
      pendingUpload.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function retryAnalysis(year: number) {
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
    triggerUpload(year, 'estimate')
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

      {years.length === 0 ? (
        <p className={styles.empty}>No CAM estimate or reconciliation documents uploaded yet.</p>
      ) : (
        <div className={styles.yearList}>
          {years.map(year => {
            const estimate = documents.find(d => d.year === year && d.doc_type === 'estimate')
            const reconciliation = documents.find(d => d.year === year && d.doc_type === 'reconciliation')
            const verdict = verdicts.find(v => v.year === year)
            const hasPair = !!estimate && !!reconciliation
            const analysisFailed = hasPair && !verdict

            return (
              <div key={year}>
                <div className={styles.yearRow}>
                  <span className={styles.yearLabel}>{year}</span>

                  <DocCell
                    doc={estimate}
                    leaseId={lease.id}
                    label="Estimate"
                    isAdmin={isAdmin}
                    uploading={uploadingKey === `${year}-estimate`}
                    onUpload={() => triggerUpload(year, 'estimate')}
                  />
                  <DocCell
                    doc={reconciliation}
                    leaseId={lease.id}
                    label="Reconciliation"
                    isAdmin={isAdmin}
                    uploading={uploadingKey === `${year}-reconciliation`}
                    onUpload={() => triggerUpload(year, 'reconciliation')}
                  />

                  <div className={styles.verdictCell}>
                    {verdict ? (
                      <button
                        type="button"
                        className={`${styles.verdictBadge} ${styles[`verdict_${verdict.verdict}`]}`}
                        onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                      >
                        {VERDICT_LABEL[verdict.verdict]}
                      </button>
                    ) : analysisFailed ? (
                      <span className={styles.pendingText}>
                        Analysis failed
                        {isAdmin && (
                          <button
                            type="button"
                            className={styles.retryBtn}
                            onClick={() => retryAnalysis(year)}
                            disabled={retryingYear === year}
                          >
                            {retryingYear === year ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </span>
                    ) : (
                      <span className={styles.pendingText}>
                        {!estimate ? 'Awaiting estimate' : 'Awaiting reconciliation'}
                      </span>
                    )}
                  </div>
                </div>

                {expandedYear === year && verdict && (
                  <div className={styles.explanation}>
                    <p>{verdict.explanation}</p>
                    <div className={styles.figures}>
                      <span>Actual: {fmtMoney(verdict.actual_total)}</span>
                      <span>Estimate: {fmtMoney(verdict.estimate_total)}</span>
                      <span>Cap: {fmtMoney(verdict.cap_amount)}</span>
                    </div>
                    {verdict.flagged_items.length > 0 && (
                      <ul className={styles.flaggedList}>
                        {verdict.flagged_items.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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

function fmtMoney(n: number | null): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
