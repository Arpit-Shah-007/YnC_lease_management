'use client'

import { useState, useRef } from 'react'
import type { Location } from '@/types/database'
import styles from './UploadModal.module.css'

type Stage = 'idle' | 'uploading' | 'extracting' | 'done' | 'error'

type Props = {
  location: Location
  leaseId: string | null
  onClose: () => void
  onExtracted: () => void
}

export default function UploadModal({ location, leaseId, onClose, onExtracted }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setStage('uploading')
    setErrorMsg(null)

    const form = new FormData()
    form.append('file', file)
    form.append('locationId', location.id)
    if (leaseId) form.append('leaseId', leaseId)

    const uploadRes = await fetch('/api/files', { method: 'POST', body: form })
    if (!uploadRes.ok) {
      const err = await uploadRes.json()
      setErrorMsg(err.error ?? 'Upload failed')
      setStage('error')
      return
    }

    const fileRecord = await uploadRes.json()

    setStage('extracting')
    const extractRes = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storagePath: fileRecord.storage_path,
        locationId: location.id,
        leaseFileId: fileRecord.id,
      }),
    })

    if (!extractRes.ok) {
      const err = await extractRes.json()
      setErrorMsg(err.error ?? 'Extraction failed')
      setStage('error')
      return
    }

    setStage('done')
    setTimeout(onExtracted, 800)
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Upload Lease — {location.short_name ?? location.display_name}</h2>
          <button className={styles.close} onClick={onClose} type="button" aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {stage === 'idle' && (
            <>
              <div
                className={styles.dropzone}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const dropped = e.dataTransfer.files[0]
                  if (dropped?.type === 'application/pdf') setFile(dropped)
                }}
              >
                {file ? (
                  <span>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                ) : (
                  <span>Drop PDF here or click to browse</span>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className={styles.hint}>
                Claude will extract all lease data automatically — lessee, lessor, dates, rent schedule, CAM, critical dates, and clause library.
              </p>
              <div className={styles.footer}>
                <button className="btn" onClick={onClose} type="button">Cancel</button>
                <button
                  className="btn btn--primary"
                  onClick={handleUpload}
                  disabled={!file}
                  type="button"
                >
                  Upload &amp; Extract
                </button>
              </div>
            </>
          )}

          {stage === 'uploading'  && <Progress label="Uploading PDF..." />}
          {stage === 'extracting' && <Progress label="Claude is reading the lease..." />}
          {stage === 'done'       && <Progress label="Done! Refreshing dashboard..." done />}

          {stage === 'error' && (
            <>
              <p style={{ color: '#c62828', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                {errorMsg}
              </p>
              <button className="btn btn--primary" onClick={() => setStage('idle')} type="button">
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Progress({ label, done }: { label: string; done?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      {!done && (
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      )}
      {done && <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>}
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
