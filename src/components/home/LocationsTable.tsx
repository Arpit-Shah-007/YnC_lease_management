'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { StaticLocation, DashboardBrand } from '@/lib/staticData'
import styles from './LocationsTable.module.css'

const MapModal = dynamic(() => import('./MapModal'), { ssr: false })

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

type Props = { locations: StaticLocation[]; brands: DashboardBrand[] }

export default function LocationsTable({ locations, brands }: Props) {
  const brandMap = useMemo(
    () => Object.fromEntries(brands.map(b => [b.id, b])),
    [brands]
  )
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [mapOpen, setMapOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const stats = useMemo(() => {
    const leaseCount = locations.filter(l => l.has_lease).length
    const totalArea = locations.reduce((s, l) => s + (l.square_footage ?? 0), 0)
    const totalRent = locations.reduce((s, l) => s + (l.base_rent_monthly_current ?? 0), 0)
    return { leaseCount, totalArea, totalRent, total: locations.length }
  }, [locations])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return locations.filter(loc => {
      if (!q) return true
      return (
        loc.address?.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q) ||
        loc.state?.toLowerCase().includes(q)
      )
    })
  }, [locations, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function goToPage(p: number) {
    setPage(p)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
  }

  function handlePageSize(e: React.ChangeEvent<HTMLSelectElement>) {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  return (
    <div className={styles.wrap} ref={topRef}>
      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.statBlock}>
          <span className={styles.statValue}>{stats.leaseCount}</span>
          <span className={styles.statLabel}>Active Leases</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <span className={styles.statValue}>
            {stats.totalArea > 0 ? stats.totalArea.toLocaleString() + ' SF' : '--'}
          </span>
          <span className={styles.statLabel}>Total Leased Area</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statBlock}>
          <span className={styles.statValue}>
            {stats.totalRent > 0 ? fmtMoney(stats.totalRent) : '--'}
          </span>
          <span className={styles.statLabel}>Total Rent / mo</span>
        </div>
        <div className={styles.statDivider} />
        <button className={styles.mapBlock} onClick={() => setMapOpen(true)} type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span className={styles.mapBlockText}>
            <span className={styles.mapBlockLabel}>View on Map</span>
            <span className={styles.mapBlockSub}>{stats.total} locations</span>
          </span>
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Locations</h2>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by location..."
            value={query}
            onChange={handleSearch}
            aria-label="Search locations"
          />
        </div>

        <div className="table-wrap">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Address</th>
                <th>Base Rent / mo</th>
                <th>Area</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>No locations match your search.</td>
                </tr>
              ) : pageItems.map(loc => (
                <tr key={loc.id}>
                  <td>
                    {(() => {
                      const b = brandMap[loc.brand]
                      const color = b?.color ?? '#555555'
                      return (
                        <span
                          className={styles.brandBadge}
                          style={{ background: color + '18', color, borderColor: color + '40' }}
                        >
                          {b?.display_name ?? loc.brand}
                        </span>
                      )
                    })()}
                  </td>
                  <td>
                    <div className={styles.addrLine1}>{loc.address}</div>
                    <div className={styles.addrLine2}>
                      {[loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td className={styles.rentCell}>
                    {loc.base_rent_monthly_current != null
                      ? fmtMoney(loc.base_rent_monthly_current)
                      : <span className={styles.noData}>--</span>
                    }
                  </td>
                  <td className={styles.areaCell}>
                    {loc.square_footage != null
                      ? `${loc.square_footage.toLocaleString()} SF`
                      : <span className={styles.noData}>--</span>
                    }
                  </td>
                  <td>
                    <span className={`chip ${loc.has_lease ? 'chip-green' : 'chip-gray'}`}>
                      {loc.has_lease ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <div className={styles.rowActions}>
                      <Link href={`/lease/${loc.slug}`} className={styles.viewBtn}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {filtered.length === 0
              ? '0 results'
              : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`}
          </span>
          <div className={styles.pageControls}>
            <label className={styles.pageSizeLabel}>
              Show
              <select className={styles.pageSizeSelect} value={pageSize} onChange={handlePageSize}>
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              &#8592; Prev
            </button>
            <span className={styles.pageNum}>{currentPage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next &#8594;
            </button>
          </div>
        </div>
      </div>

      {mapOpen && (
        <MapModal brands={brands} onClose={() => setMapOpen(false)} />
      )}

    </div>
  )
}

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
