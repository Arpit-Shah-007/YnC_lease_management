'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { StaticLocation } from '@/lib/staticData'
import styles from './LeaseHeader.module.css'

const BRAND_LABEL: Record<string, string> = {
  wendys:   "Wendy's",
  tacobell: 'Taco Bell',
}

const BRAND_COLOR: Record<string, string> = {
  wendys:   '#e2211c',
  tacobell: '#702082',
}

type Props = {
  currentLocation: StaticLocation
  allLocations: StaticLocation[]
  hasLeaseFile: boolean
}

export default function LeaseHeader({ currentLocation, allLocations, hasLeaseFile }: Props) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const brandGroups = allLocations.reduce<Record<string, StaticLocation[]>>((acc, loc) => {
    if (!acc[loc.brand]) acc[loc.brand] = []
    acc[loc.brand].push(loc)
    return acc
  }, {})

  const brandOrder = Object.keys(brandGroups).sort()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <button
            className={styles.backBtn}
            onClick={() => router.push('/')}
            type="button"
            aria-label="Back to all leases"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>All Leases</span>
          </button>
        </div>

        <div className={styles.center}>
          <div className={styles.logoWrap}>
            <Image src="/yc-logo.png" alt="Y&C" width={40} height={28} style={{ height: '28px', width: 'auto' }} />
          </div>
          <div className={styles.titles}>
            <span className={styles.title}>Yum and Chill</span>
            <span className={styles.subtitle}>Lease Management</span>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.dropdownWrap}>
            <button
              className={styles.dropdownTrigger}
              onClick={() => setDropdownOpen(v => !v)}
              type="button"
            >
              <div className={styles.triggerDot} style={{ background: BRAND_COLOR[currentLocation.brand] }} />
              <span className={styles.triggerText}>{currentLocation.display_name}</span>
              <svg className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {dropdownOpen && (
              <>
                <div className={styles.backdrop} onClick={() => setDropdownOpen(false)} />
                <div className={styles.dropdown}>
                  <div className={styles.dropdownGrid} style={{ gridTemplateColumns: `repeat(${brandOrder.length}, 1fr)` }}>
                    {brandOrder.map(brand => (
                      <div key={brand} className={styles.brandCol}>
                        <div
                          className={styles.brandColHead}
                          style={{ color: BRAND_COLOR[brand] ?? '#666' }}
                        >
                          {BRAND_LABEL[brand] ?? brand}
                        </div>
                        {brandGroups[brand].map(loc => (
                          <button
                            key={loc.id}
                            className={`${styles.locItem} ${loc.id === currentLocation.id ? styles.locItemActive : ''}`}
                            onClick={() => {
                              setDropdownOpen(false)
                              router.push(`/lease/${loc.id}`)
                            }}
                            type="button"
                          >
                            <span className={styles.locName}>{loc.short_name ?? loc.display_name}</span>
                            <span className={styles.locCity}>{loc.city}, {loc.state}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            className={styles.downloadBtn}
            type="button"
            disabled={!hasLeaseFile}
            title={hasLeaseFile ? 'Download lease PDF' : 'No lease file uploaded'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download Lease
          </button>
        </div>
      </div>
    </header>
  )
}
