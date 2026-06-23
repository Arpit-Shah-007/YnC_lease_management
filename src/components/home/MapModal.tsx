'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Location } from '@/types/database'
import styles from './MapModal.module.css'

type Props = { onClose: () => void }

type LocationRow = Location & { leases: { status: string }[] }

type Status = 'loading' | 'ready' | 'error'

const BRAND_COLOR: Record<string, string> = { wendys: '#e2211c', tacobell: '#702082' }
const BRAND_LABEL: Record<string, string> = { wendys: "Wendy's", tacobell: 'Taco Bell' }

export default function MapModal({ onClose }: Props) {
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

        const bounds: [number, number][] = []

        rows.forEach(loc => {
          if (loc.lat == null || loc.lng == null) return

          const color = BRAND_COLOR[loc.brand] ?? '#555'
          const active = loc.leases.some(l => l.status === 'active')
          const size = active ? 16 : 12
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${active ? '#fff' : 'rgba(255,255,255,.55)'};box-shadow:0 1px 5px rgba(0,0,0,.4);opacity:${active ? 1 : 0.65}"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })

          const popup = `<div style="font-family:system-ui,sans-serif;font-size:13px;min-width:155px;line-height:1.5">`
            + `<div style="font-weight:700;color:${color};margin-bottom:2px">${BRAND_LABEL[loc.brand] ?? loc.brand}</div>`
            + `<div style="font-weight:600;color:#1a1523">${loc.display_name}</div>`
            + `<div style="color:#574f65;font-size:12px">${loc.address ?? ''}</div>`
            + `<div style="color:#574f65;font-size:12px">${[loc.city, loc.state].filter(Boolean).join(', ')}</div>`
            + (active ? `<div style="margin-top:4px;color:#1f7a4d;font-size:11px;font-weight:600">Active Lease</div>` : '')
            + `</div>`

          L.marker([loc.lat, loc.lng], { icon }).bindPopup(popup, { maxWidth: 240 }).addTo(map!)
          bounds.push([loc.lat, loc.lng])
        })

        if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32] })
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
  }, [])

  return (
    <div className={styles.root} role="dialog" aria-modal aria-label="Locations map">
      <div ref={mapElRef} className={styles.mapEl} />

      {status === 'loading' && <div className={styles.status}>Loading locations…</div>}
      {status === 'error' && <div className={styles.status}>Couldn&apos;t load locations.</div>}

      <div className={styles.bar}>
        <div className={styles.legend}>
          <span className={styles.dot} style={{ background: '#e2211c' }} /> Wendy&apos;s
          <span className={styles.dot} style={{ background: '#702082', marginLeft: '10px' }} /> Taco Bell
          <span className={styles.note}>Larger dot = active lease</span>
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
