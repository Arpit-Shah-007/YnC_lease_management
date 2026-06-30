'use client'

import { useState } from 'react'
import type { LeaseExtractionResult } from '@/types/database'
import styles from './LeaseReviewModal.module.css'

type Props = {
  fileName: string
  extraction: LeaseExtractionResult
  leaseId: string
  locationId: string
  onSaved: (fileEntry: { id: string; file_name: string; storage_bucket: string; storage_path: string; file_size_bytes: number | null; mime_type: string | null; uploaded_at: string }) => void
  onCancel: () => void
  pendingFile: File
}

type ScalarFields = {
  lessee: string
  lessor: string
  possession_date: string
  commencement_date: string
  expiry_date: string
  execution_date: string
  rent_commencement_date: string
  original_commencement_date: string
  term_type: string
  rent_structure: string
  term_length_months: string
  square_footage: string
  area_unit: string
  space_type: string
  base_rent_monthly: string
  cam_estimated_monthly: string
  pro_rata_share: string
  security_deposit: string
}

function nullToStr(v: string | number | null | undefined): string {
  if (v == null) return ''
  return String(v)
}

export default function LeaseReviewModal({ fileName, extraction, leaseId, locationId, onSaved, onCancel, pendingFile }: Props) {
  const [fields, setFields] = useState<ScalarFields>({
    lessee:                    nullToStr(extraction.lessee),
    lessor:                    nullToStr(extraction.lessor),
    possession_date:           nullToStr(extraction.possession_date),
    commencement_date:         nullToStr(extraction.commencement_date),
    expiry_date:               nullToStr(extraction.expiry_date),
    execution_date:            nullToStr(extraction.execution_date),
    rent_commencement_date:    nullToStr(extraction.rent_commencement_date),
    original_commencement_date: nullToStr(extraction.original_commencement_date),
    term_type:                 nullToStr(extraction.term_type),
    rent_structure:            nullToStr(extraction.rent_structure),
    term_length_months:        nullToStr(extraction.term_length_months),
    square_footage:            nullToStr(extraction.square_footage),
    area_unit:                 nullToStr(extraction.area_unit) || 'SF',
    space_type:                nullToStr(extraction.space_type),
    base_rent_monthly:         nullToStr(extraction.base_rent_monthly),
    cam_estimated_monthly:     nullToStr(extraction.cam_estimated_monthly),
    pro_rata_share:            nullToStr(extraction.pro_rata_share),
    security_deposit:          nullToStr(extraction.security_deposit),
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof ScalarFields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function numOrNull(s: string): number | null {
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    const reviewedData: LeaseExtractionResult = {
      ...extraction,
      lessee:                     fields.lessee || null,
      lessor:                     fields.lessor || null,
      possession_date:            fields.possession_date || null,
      commencement_date:          fields.commencement_date || null,
      expiry_date:                fields.expiry_date || null,
      execution_date:             fields.execution_date || null,
      rent_commencement_date:     fields.rent_commencement_date || null,
      original_commencement_date: fields.original_commencement_date || null,
      term_type:                  fields.term_type || null,
      rent_structure:             fields.rent_structure || null,
      term_length_months:         numOrNull(fields.term_length_months),
      square_footage:             numOrNull(fields.square_footage),
      area_unit:                  fields.area_unit || null,
      space_type:                 fields.space_type || null,
      base_rent_monthly:          numOrNull(fields.base_rent_monthly),
      cam_estimated_monthly:      numOrNull(fields.cam_estimated_monthly),
      pro_rata_share:             numOrNull(fields.pro_rata_share),
      security_deposit:           numOrNull(fields.security_deposit),
    }

    const fd = new FormData()
    fd.append('file', pendingFile)
    fd.append('locationId', locationId)
    fd.append('reviewedData', JSON.stringify(reviewedData))

    try {
      const res = await fetch('/api/admin/lease-upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Save failed')
        return
      }

      const fileId = json.fileId as string
      onSaved({
        id: fileId,
        file_name: pendingFile.name,
        storage_bucket: 'leases',
        storage_path: '',
        file_size_bytes: pendingFile.size,
        mime_type: 'application/pdf',
        uploaded_at: new Date().toISOString(),
      })
    } catch {
      setError('Save failed. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-labelledby="review-title">
        <div className={styles.modalHeader}>
          <span className={styles.aiChip}>AI Extracted</span>
          <div>
            <h2 className={styles.modalTitle} id="review-title">Review Lease Data</h2>
            <p className={styles.modalSubtitle}>{fileName}</p>
          </div>
        </div>

        <div className={styles.scrollArea}>
          {error && <p className={styles.errorBanner}>{error}</p>}

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Parties</p>
            <div className={styles.grid}>
              <Field label="Lessee" value={fields.lessee} onChange={v => set('lessee', v)} />
              <Field label="Lessor" value={fields.lessor} onChange={v => set('lessor', v)} />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Key Dates</p>
            <div className={styles.grid}>
              <Field label="Commencement Date" type="date" value={fields.commencement_date} onChange={v => set('commencement_date', v)} />
              <Field label="Expiry Date" type="date" value={fields.expiry_date} onChange={v => set('expiry_date', v)} />
              <Field label="Execution Date" type="date" value={fields.execution_date} onChange={v => set('execution_date', v)} />
              <Field label="Possession Date" type="date" value={fields.possession_date} onChange={v => set('possession_date', v)} />
              <Field label="Rent Commencement" type="date" value={fields.rent_commencement_date} onChange={v => set('rent_commencement_date', v)} />
              <Field label="Original Commencement" type="date" value={fields.original_commencement_date} onChange={v => set('original_commencement_date', v)} />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Lease Structure</p>
            <div className={styles.grid}>
              <Field label="Rent Structure" value={fields.rent_structure} onChange={v => set('rent_structure', v)} placeholder="NNN, NN, Gross..." />
              <Field label="Term Type" value={fields.term_type} onChange={v => set('term_type', v)} placeholder="Fixed, Month-to-Month..." />
              <Field label="Term Length (months)" type="number" value={fields.term_length_months} onChange={v => set('term_length_months', v)} />
              <Field label="Space Type" value={fields.space_type} onChange={v => set('space_type', v)} placeholder="Retail, Pad Site..." />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Property</p>
            <div className={styles.grid3}>
              <Field label="Square Footage" type="number" value={fields.square_footage} onChange={v => set('square_footage', v)} />
              <Field label="Area Unit" value={fields.area_unit} onChange={v => set('area_unit', v)} placeholder="SF, Acres..." />
              <Field label="Pro-Rata Share (%)" type="number" value={fields.pro_rata_share} onChange={v => set('pro_rata_share', v)} />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Financial</p>
            <div className={styles.grid}>
              <Field label="Monthly Base Rent ($)" type="number" value={fields.base_rent_monthly} onChange={v => set('base_rent_monthly', v)} />
              <Field label="Monthly CAM Est. ($)" type="number" value={fields.cam_estimated_monthly} onChange={v => set('cam_estimated_monthly', v)} />
              <Field label="Security Deposit ($)" type="number" value={fields.security_deposit} onChange={v => set('security_deposit', v)} />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            {extraction.rent_schedule.length > 0 && `${extraction.rent_schedule.length} rent schedule entries, `}
            {extraction.critical_dates.length > 0 && `${extraction.critical_dates.length} critical dates, `}
            {extraction.clauses.length > 0 && `${extraction.clauses.length} clauses`} extracted.
          </p>
          <button className={styles.cancelBtn} type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className={styles.saveBtn} type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Lease'}
          </button>
        </div>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'date' | 'number'
  placeholder?: string
}

function Field({ label, value, onChange, type = 'text', placeholder }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
