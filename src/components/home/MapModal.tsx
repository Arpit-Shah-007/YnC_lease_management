'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { DashboardBrand } from '@/lib/staticData'
import type { Location } from '@/types/database'
import styles from './MapModal.module.css'

type Props = {
  brands: DashboardBrand[]
  onClose: () => void
}

// PostgREST returns a single object (not array) when FK has a UNIQUE constraint
type LeaseEmbed = { status: string } | { status: string }[] | null
type LocationRow = Location & { leases: LeaseEmbed }

type Status = 'loading' | 'ready' | 'error'

function isActive(leases: LeaseEmbed): boolean {
  if (!leases) return false
  const obj = Array.isArray(leases) ? leases[0] : leases
  return obj?.status === 'active'
}

export default function MapModal({ brands, onClose }: Props) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    let map: import('leaflet').Map | undefined

    async function init() {
      setStatus('loading')
      try {
        const [res, leafletModule] = await Promise.all([
          fetch('/api/locations'),
          import('leaflet'),
        ])
        if (!res.ok) throw new Error('Failed to load locations')
        const rows: LocationRow[] = await res.json()
        if (cancelled || !mapElRef.current) return

        const L = leafletModule.default
        map = L.map(mapElRef.current, { center: [40.4, -74.8], zoom: 8 })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
        const bounds: [number, number][] = []

        rows.forEach(loc => {
          if (loc.lat == null || loc.lng == null) return

          const brand = brandMap[loc.brand]
          const color = brand?.color ?? '#555555'
          const label = brand?.display_name ?? loc.brand
          const active = isActive(loc.leases)
          const size = 14

          const icon = L.divIcon({
            className: '',
            html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);opacity:${active ? 1 : 0.55}"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })

          const popup = `<div style="font-family:system-ui,sans-serif;font-size:13px;min-width:155px;line-height:1.5">`
            + `<div style="font-weight:700;color:${color};margin-bottom:2px">${label}</div>`
            + `<div style="font-weight:600;color:#1a1523">${loc.display_name}</div>`
            + `<div style="color:#574f65;font-size:12px">${loc.address ?? ''}</div>`
            + `<div style="color:#574f65;font-size:12px">${[loc.city, loc.state].filter(Boolean).join(', ')}</div>`
            + (active ? `<div style="margin-top:4px;color:#1f7a4d;font-size:11px;font-weight:600">Active Lease</div>` : '')
            + `</div>`

          L.marker([loc.lat, loc.lng], { icon }).bindPopup(popup, { maxWidth: 240 }).addTo(map!)
          bounds.push([loc.lat, loc.lng])
        })

        if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32] })
        else if (bounds.length === 1) map.setView(bounds[0], 13)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    init()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [brands])

  const mappableBrands = brands.filter(b =>
    b.id !== 'starbucks'
  )

  return (
    <div className={styles.root} role="dialog" aria-modal aria-label="Locations map">
      <div ref={mapElRef} className={styles.mapEl} />

      {status === 'loading' && <div className={styles.status}>Loading map…</div>}
      {status === 'error' && <div className={styles.status}>Couldn&apos;t load locations.</div>}

      <div className={styles.bar}>
        <div className={styles.legend}>
          {mappableBrands.map((b, i) => (
            <span key={b.id} style={{ marginLeft: i > 0 ? 10 : 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className={styles.dot} style={{ background: b.color }} />
              {b.display_name}
            </span>
          ))}
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close map">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>
    </div>
  )
}
