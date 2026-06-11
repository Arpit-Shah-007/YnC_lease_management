'use client'

import { useState, useEffect } from 'react'
import LocationPicker from './LocationPicker'
import FactsBar from './FactsBar'
import TabNav from './TabNav'
import UploadModal from './UploadModal'
import type { Location, LeaseWithRelations, BrandType } from '@/types/database'
import styles from './DashboardHeader.module.css'

const BRAND_COLORS: Record<BrandType, string> = {
  wendys:    '#e2211c',
  tacobell:  '#702082',
  starbucks: '#00704a',
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
  const accentColor = location ? BRAND_COLORS[location.brand] : '#1a1a1a'

  useEffect(() => {
    if (!locationId) return
    setLoading(true)
    fetch(`/api/leases?locationId=${locationId}`)
      .then(r => r.json())
      .then(data => setLease(data))
      .finally(() => setLoading(false))
  }, [locationId])

  const dateRange = lease?.commencement_date && lease?.expiry_date
    ? `${formatDate(lease.commencement_date)} – ${formatDate(lease.expiry_date)}`
    : null

  return (
    <>
      <style>{`:root { --accent: ${accentColor}; }`}</style>

      <header className={styles.header}>
        <div className={styles.idRow}>
          {/* Left: map + name + city */}
          <div className={styles.nameBlock}>
            {location?.maps_url && (
              <a
                href={location.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapThumb}
                aria-label="Open in Google Maps"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
              </a>
            )}
            <div>
              <div className={styles.nameTop}>
                <span className="badge" style={{ background: accentColor }} />
                <h1 className={styles.h1}>{location?.display_name ?? 'Select a location'}</h1>
              </div>
              {location && (
                <div className={styles.city}>
                  {[location.city, location.state, location.zip].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Right: status + term + lessee + lessor */}
          <div className={styles.metaBlock}>
            {lease && (
              <>
                <span className="pill pill--active">Active Lease</span>
                {dateRange && <span className={styles.termRange}>Term {dateRange}</span>}
                {lease.lessee && <span className={styles.metaLine}>Lessee: {lease.lessee}</span>}
                {lease.lessor && <span className={styles.metaLine}>Lessor: {lease.lessor}</span>}
              </>
            )}
            {!lease && !loading && location && !location.coming_soon && (
              <span className="pill pill--pending">No lease data</span>
            )}
            {location?.coming_soon && (
              <span className="pill pill--soon">Coming Soon</span>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <LocationPicker
              locations={locations}
              selectedId={locationId}
              onChange={setLocationId}
            />
            <button
              className="btn btn--primary"
              onClick={() => setShowUpload(true)}
              type="button"
              disabled={!locationId}
            >
              Upload Lease
            </button>
          </div>
        </div>

        {lease && <FactsBar lease={lease} />}
      </header>

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
            // Re-fetch lease after extraction
            fetch(`/api/leases?locationId=${locationId}`)
              .then(r => r.json())
              .then(setLease)
          }}
        />
      )}
    </>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
