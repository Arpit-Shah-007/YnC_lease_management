'use client'

import { useState, useEffect } from 'react'
import LocationPicker from './LocationPicker'
import FactsBar from './FactsBar'
import TabNav from './TabNav'
import UploadModal from './UploadModal'
import type { Location, LeaseWithRelations } from '@/types/database'
import styles from './DashboardHeader.module.css'

const BRAND_COLORS: Record<string, string> = {
  wendys:   '#e2211c',
  tacobell: '#702082',
}

const BRAND_INITIALS: Record<string, string> = {
  wendys:   'W',
  tacobell: 'TB',
}

const BRAND_LABELS: Record<string, string> = {
  wendys:   "WENDY'S",
  tacobell: 'TACO BELL',
}

type Props = {
  locations: Location[]
  initialLocationId: string | null
}

export default function DashboardHeader({ locations, initialLocationId }: Props) {
  const [locationId, setLocationId] = useState<string | null>(initialLocationId)
  const [lease, setLease] = useState<LeaseWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const location = locations.find(l => l.id === locationId) ?? null
  const accentColor = location ? BRAND_COLORS[location.brand] : '#e2211c'
  const brandInitial = location ? BRAND_INITIALS[location.brand] : 'Y&C'
  const brandLabel = location ? BRAND_LABELS[location.brand] : null

  useEffect(() => {
    if (!locationId) { setLease(null); return }
    setLoading(true)
    fetch(`/api/leases?locationId=${locationId}`)
      .then(r => r.json())
      .then(data => setLease(data ?? null))
      .finally(() => setLoading(false))
  }, [locationId])

  const termMonths = lease?.commencement_date && lease?.expiry_date
    ? Math.round(
        (new Date(lease.expiry_date).getTime() - new Date(lease.commencement_date).getTime())
        / (1000 * 60 * 60 * 24 * 30.437)
      )
    : null

  const cityState = location
    ? [location.city, location.state].filter(Boolean).join(', ')
    : null

  const breadcrumb = [cityState, lease?.lessor].filter(Boolean).join(' / ')

  return (
    <>
      <style>{`:root { --accent: ${accentColor}; }`}</style>

      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Top row: wordmark + badge + picker + upload */}
          <div className={styles.topRow}>
            <div className={styles.wordmarkRow}>
              <div className={styles.logoBox} style={{ background: accentColor }}>
                {brandInitial}
              </div>
              <span className={styles.wordmark}>Yum &amp; Chill &middot; Lease Management</span>
            </div>

            <div className={styles.actions}>
              {lease && !loading && (
                <span className={styles.activeBadge}>Active Lease</span>
              )}
              {!lease && !loading && location && !location.coming_soon && (
                <span className={styles.pendingBadge}>No Lease Data</span>
              )}
              {location?.coming_soon && (
                <span className={styles.pendingBadge}>Coming Soon</span>
              )}
              <LocationPicker
                locations={locations}
                selectedId={locationId}
                onChange={setLocationId}
                dark
              />
              <button
                className={styles.uploadBtn}
                onClick={() => setShowUpload(true)}
                type="button"
                disabled={!locationId || location?.coming_soon === true}
              >
                Upload Lease
              </button>
            </div>
          </div>

          {/* Location title block */}
          <div className={styles.titleBlock}>
            {brandLabel && (
              <div className={styles.brandLabel} style={{ color: accentColor }}>
                {brandLabel}
              </div>
            )}
            <h1 className={styles.h1}>
              {location?.display_name ?? 'Select a location'}
            </h1>
            {breadcrumb && (
              <div className={styles.sub}>{breadcrumb}</div>
            )}
            {lease?.lessee && (
              <div className={styles.sub}>Lessee: {lease.lessee}</div>
            )}
          </div>

          {/* 5-fact chip strip — only when lease data is loaded */}
          {lease && (
            <div className={styles.factChips}>
              {lease.square_footage != null && (
                <span className={styles.factChip}>
                  {lease.square_footage.toLocaleString()} SF
                </span>
              )}
              {lease.term_type && (
                <span className={styles.factChip}>{lease.term_type}</span>
              )}
              {termMonths != null && (
                <span className={styles.factChip}>{termMonths} months</span>
              )}
              {lease.base_rent_monthly != null && (
                <span className={styles.factChip}>
                  {fmtMoney(lease.base_rent_monthly)}/mo
                </span>
              )}
              {lease.expiry_date && (
                <span className={styles.factChip}>{fmtDate(lease.expiry_date)}</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CAM KPI strip */}
      {lease && <FactsBar lease={lease} />}

      {/* Empty state */}
      {location && !lease && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {location.coming_soon ? (
            <p>This location is coming soon. Lease data not yet available.</p>
          ) : (
            <>
              <p>No lease uploaded for this location yet.</p>
              <button
                className={styles.uploadBtnEmpty}
                onClick={() => setShowUpload(true)}
                type="button"
              >
                Upload Lease PDF
              </button>
            </>
          )}
        </div>
      )}

      {!location && locations.length > 0 && (
        <div className={styles.emptyState}>
          <p>Select a location from the dropdown above to view lease details.</p>
        </div>
      )}

      {locations.length === 0 && (
        <div className={styles.emptyState}>
          <p>No locations found. Check your Supabase connection and seed data.</p>
        </div>
      )}

      {/* Tab content */}
      {location && lease && (
        <TabNav location={location} lease={lease} />
      )}

      {showUpload && location && (
        <UploadModal
          location={location}
          leaseId={lease?.id ?? null}
          onClose={() => setShowUpload(false)}
          onExtracted={() => {
            setShowUpload(false)
            fetch(`/api/leases?locationId=${locationId}`)
              .then(r => r.json())
              .then(data => setLease(data ?? null))
          }}
        />
      )}
    </>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
