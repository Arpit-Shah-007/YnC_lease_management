'use client'

import { useRef, useState } from 'react'
import type { LeaseFile } from '@/types/database'
import styles from './LeaseDocuments.module.css'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const PDF_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)

const DOWNLOAD_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
)

const TRASH_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const UPLOAD_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
)

type Props = {
  initialFiles: LeaseFile[]
  leaseId: string
  locationId: string
  isAdmin: boolean
}

export default function LeaseDocuments({ initialFiles, leaseId, locationId, isAdmin }: Props) {
  const [files, setFiles] = useState<LeaseFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('leaseId', leaseId)
    fd.append('locationId', locationId)

    try {
      const res = await fetch('/api/admin/lease-files/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Upload failed')
      } else {
        setFiles(prev => [json.file as LeaseFile, ...prev])
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    setConfirmTarget(null)
    setError(null)
    setDeletingId(id)

    try {
      const res = await fetch(
        `/api/admin/lease-files/${id}?leaseId=${encodeURIComponent(leaseId)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Delete failed')
      } else {
        setFiles(prev => prev.filter(f => f.id !== id))
      }
    } catch {
      setError('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Documents</h2>
        {isAdmin && (
          <>
            <button
              className={styles.uploadBtn}
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {UPLOAD_ICON}
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className={styles.hiddenInput}
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {confirmTarget && (
        <div className={styles.dialogOverlay} onClick={() => setConfirmTarget(null)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal>
            <div className={styles.dialogIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className={styles.dialogTitle}>Delete document?</h3>
            <p className={styles.dialogBody}>
              <strong>{confirmTarget.name}</strong> will be permanently removed and cannot be recovered.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} type="button" onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button className={styles.dialogConfirm} type="button" onClick={() => handleDelete(confirmTarget.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <p className={styles.empty}>No documents uploaded yet.</p>
      ) : (
        <ul className={styles.list}>
          {files.map(file => (
            <li key={file.id} className={styles.item}>
              <span className={styles.fileIcon}>{PDF_ICON}</span>
              <span className={styles.fileName}>{file.file_name}</span>
              <span className={styles.fileMeta}>
                {formatBytes(file.file_size_bytes)}
                {file.file_size_bytes ? ' · ' : ''}
                {formatDate(file.uploaded_at)}
              </span>
              <div className={styles.actions}>
                <a
                  href={`/api/admin/lease-files/${file.id}/download?leaseId=${encodeURIComponent(leaseId)}`}
                  className={styles.actionBtn}
                  title="Download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {DOWNLOAD_ICON}
                </a>
                {isAdmin && (
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    type="button"
                    title="Delete"
                    disabled={deletingId === file.id}
                    onClick={() => setConfirmTarget({ id: file.id, name: file.file_name })}
                  >
                    {TRASH_ICON}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
