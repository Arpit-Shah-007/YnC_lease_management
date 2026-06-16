'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AdminActions.module.css'

type Modal = 'brand' | 'location' | null

type Brand = { id: string; display_name: string; color: string }

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// ── Slide-over shell ────────────────────────────────────────────────

function SlideOver({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{title}</h2>
          <button className={styles.panelClose} onClick={onClose} type="button" aria-label="Close panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Add Brand form ──────────────────────────────────────────────────

function AddBrandForm({ onSuccess }: { onSuccess: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [brandKey, setBrandKey] = useState('')
  const [color, setColor] = useState('#e2211c')
  const [keyAutoFill, setKeyAutoFill] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toSlug(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
  }

  function handleName(val: string) {
    setDisplayName(val)
    if (keyAutoFill) setBrandKey(toSlug(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: brandKey, display_name: displayName, color }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add brand')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formBody}>
        <div className={styles.field}>
          <label className={styles.label}>Brand Name <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            value={displayName}
            onChange={e => handleName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Brand Key <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            value={brandKey}
            onChange={e => {
              setKeyAutoFill(false)
              setBrandKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
            }}
            required
            pattern="[a-z0-9]+"
            title="Lowercase letters and numbers only"
          />
          <p className={styles.hint}>Auto-filled from name. Lowercase, no spaces.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Brand Color</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              className={styles.colorSwatch}
              value={color}
              onChange={e => setColor(e.target.value)}
            />
            <input
              className={styles.input}
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
          <div className={styles.colorPreview} style={{ background: color }}>
            <span>{displayName || 'Brand Name'}</span>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      <div className={styles.formFoot}>
        <button type="submit" className={styles.submitBtn} disabled={loading || !displayName || !brandKey}>
          {loading ? 'Adding...' : 'Add Brand'}
        </button>
      </div>
    </form>
  )
}

// ── Add Location form ───────────────────────────────────────────────

function AddLocationForm({ onSuccess }: { onSuccess: () => void }) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [brand, setBrand] = useState('')
  const [storeNumber, setStoreNumber] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateAbbr, setStateAbbr] = useState('NJ')
  const [zip, setZip] = useState('')
  const [leaseFile, setLeaseFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/brands')
      .then(r => r.json())
      .then((data: Brand[]) => {
        if (Array.isArray(data)) {
          setBrands(data)
          if (data.length > 0) setBrand(b => b || data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const selectedBrand = brands.find(b => b.id === brand)

  function buildMapsUrl() {
    const parts = [address, city, stateAbbr, zip].filter(Boolean).join(' ')
    if (!parts) return null
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand || !storeNumber || !displayName || !leaseFile) return
    setLoading(true)
    setError('')

    try {
      setStatus('Creating location...')
      const locRes = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          store_number: storeNumber,
          display_name: displayName,
          address: address || null,
          city: city || null,
          state: stateAbbr || null,
          zip: zip || null,
          maps_url: buildMapsUrl(),
        }),
      })
      const locJson = await locRes.json()
      if (!locRes.ok) throw new Error(locJson.error ?? 'Failed to create location')

      setStatus('Uploading lease PDF...')
      const fd = new FormData()
      fd.append('file', leaseFile)
      fd.append('locationId', locJson.data.id)

      setStatus('Extracting lease data with AI...')
      const uploadRes = await fetch('/api/admin/lease-upload', {
        method: 'POST',
        body: fd,
      })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? 'Lease upload failed')

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formBody}>
        {/* Brand */}
        <div className={styles.field}>
          <label className={styles.label}>Brand <span className={styles.req}>*</span></label>
          {brands.length === 0 ? (
            <p className={styles.hint}>Loading brands...</p>
          ) : (
            <select className={styles.select} value={brand} onChange={e => setBrand(e.target.value)} required>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.display_name}</option>
              ))}
            </select>
          )}
          {selectedBrand && (
            <div className={styles.brandDot} style={{ background: selectedBrand.color }}>
              {selectedBrand.display_name}
            </div>
          )}
        </div>

        {/* Store Number */}
        <div className={styles.field}>
          <label className={styles.label}>Store Number</label>
          <input
            className={styles.input}
            value={storeNumber}
            onChange={e => setStoreNumber(e.target.value)}
          />
        </div>

        {/* Display Name */}
        <div className={styles.field}>
          <label className={styles.label}>Display Name <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
        </div>

        {/* Address */}
        <div className={styles.field}>
          <label className={styles.label}>Street Address</label>
          <input
            className={styles.input}
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>

        {/* City / State / Zip */}
        <div className={styles.threeCol}>
          <div className={styles.fieldNoGap} style={{ gridColumn: 'span 1', flex: 2 }}>
            <label className={styles.label}>City</label>
            <input
              className={styles.input}
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div className={styles.fieldNoGap}>
            <label className={styles.label}>State</label>
            <select className={styles.select} value={stateAbbr} onChange={e => setStateAbbr(e.target.value)}>
              <option value="">—</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.fieldNoGap}>
            <label className={styles.label}>Zip</label>
            <input
              className={styles.input}
              value={zip}
              onChange={e => setZip(e.target.value)}
              maxLength={10}
            />
          </div>
        </div>

        {/* Lease Upload — required */}
        <div className={styles.uploadSection}>
          <div className={styles.uploadLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Lease PDF <span className={styles.req}>*</span>
          </div>
          <p className={styles.hint}>Required. AI will extract all lease data from the PDF automatically.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className={styles.fileInput}
            onChange={e => setLeaseFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className={styles.fileBtn}
            onClick={() => fileRef.current?.click()}
          >
            {leaseFile ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {leaseFile.name}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Choose PDF
              </>
            )}
          </button>
          {leaseFile && (
            <button type="button" className={styles.clearFile} onClick={() => { setLeaseFile(null); if (fileRef.current) fileRef.current.value = '' }}>
              Remove
            </button>
          )}
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
        {loading && status && <p className={styles.statusMsg}>{status}</p>}
      </div>

      <div className={styles.formFoot}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !brand || !displayName || !leaseFile}
        >
          {loading ? 'Adding...' : 'Add Location'}
        </button>
      </div>
    </form>
  )
}

// ── Main export ─────────────────────────────────────────────────────

const PLUS_SVG = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function AdminActions() {
  const [open, setOpen] = useState<Modal>(null)
  const router = useRouter()

  function handleSuccess() {
    setOpen(null)
    router.refresh()
  }

  return (
    <>
      <button className={styles.ghostBtn} type="button" onClick={() => setOpen('brand')}>
        {PLUS_SVG}
        Add Brand
      </button>
      <button className={styles.ghostBtn} type="button" onClick={() => setOpen('location')}>
        {PLUS_SVG}
        Add Location
      </button>

      {open === 'brand' && (
        <SlideOver title="Add Brand" onClose={() => setOpen(null)}>
          <AddBrandForm onSuccess={handleSuccess} />
        </SlideOver>
      )}
      {open === 'location' && (
        <SlideOver title="Add Location" onClose={() => setOpen(null)}>
          <AddLocationForm onSuccess={handleSuccess} />
        </SlideOver>
      )}
    </>
  )
}
