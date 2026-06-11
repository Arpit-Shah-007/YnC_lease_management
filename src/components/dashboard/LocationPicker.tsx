'use client'

import { useState, useRef, useEffect } from 'react'
import type { Location, BrandType } from '@/types/database'
import styles from './LocationPicker.module.css'

const BRAND_COLORS: Record<BrandType, string> = {
  wendys:    '#e2211c',
  tacobell:  '#702082',
  starbucks: '#00704a',
}

const BRAND_LABELS: Record<BrandType, string> = {
  wendys:    "Wendy's",
  tacobell:  'Taco Bell',
  starbucks: 'Starbucks',
}

type Props = {
  locations: Location[]
  selectedId: string | null
  onChange: (id: string) => void
}

export default function LocationPicker({ locations, selectedId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = locations.find(l => l.id === selectedId)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const brands = Array.from(new Set(locations.map(l => l.brand))) as BrandType[]

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        {selected ? (
          <>
            <span
              className="badge"
              style={{ background: BRAND_COLORS[selected.brand] }}
            />
            {selected.display_name}
          </>
        ) : (
          'Select location'
        )}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {brands.map(brand => (
            <div key={brand}>
              <div className={styles.groupLabel} style={{ color: BRAND_COLORS[brand] }}>
                {BRAND_LABELS[brand]}
              </div>
              {locations
                .filter(l => l.brand === brand)
                .map(loc => (
                  <button
                    key={loc.id}
                    className={`${styles.option} ${loc.id === selectedId ? styles.optionActive : ''}`}
                    onClick={() => { onChange(loc.id); setOpen(false) }}
                    type="button"
                    disabled={loc.coming_soon}
                  >
                    {loc.display_name}
                    {loc.coming_soon && (
                      <span className={`pill pill--soon ${styles.soonPill}`}>Soon</span>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
