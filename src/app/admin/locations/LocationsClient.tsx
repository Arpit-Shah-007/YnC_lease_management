'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SlideOver, AddLocationForm, RecycleBin } from '@/components/home/AdminActions'
import styles from './page.module.css'
import type { AdminBrand, AdminLocation } from './page'

const PAGE_SIZE = 10

// ── Locations table ────────────────────────────────────────────────────

export function LocationsTable({ locations, brands }: { locations: AdminLocation[]; brands: AdminBrand[] }) {
  const [query, setQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [trashCount, setTrashCount] = useState(0)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/deleted-locations')
      .then(r => r.ok ? r.json() : [])
      .then((data: unknown[]) => { if (Array.isArray(data)) setTrashCount(data.length) })
      .catch(() => {})
  }, [])

  const brandMap = useMemo(
    () => Object.fromEntries(brands.map(b => [b.id, b])),
    [brands]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return locations.filter(loc => {
      if (brandFilter && loc.brand !== brandFilter) return false
      if (!q) return true
      return (
        loc.display_name.toLowerCase().includes(q) ||
        (loc.address ?? '').toLowerCase().includes(q) ||
        (loc.city ?? '').toLowerCase().includes(q) ||
        (loc.store_number ?? '').toLowerCase().includes(q)
      )
    })
  }, [locations, query, brandFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)

  function handleQuery(val: string) { setQuery(val); setPage(1) }
  function handleBrandFilter(val: string) { setBrandFilter(val); setPage(1) }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardTitle}>All Locations</h2>
          </div>
          <div className={styles.cardHeadRight}>
            <span className={styles.countBadge}>{locations.length} locations</span>
            <button className={styles.trashBtn} type="button" onClick={() => setTrashOpen(true)} style={{ position: 'relative' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M9 6V4h6v2" />
              </svg>
              Trash
              {trashCount > 0 && <span className={styles.trashBadge}>{trashCount}</span>}
            </button>
            <button className={styles.addBtn} type="button" onClick={() => setAddOpen(true)}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Location
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name, address, or store #..."
              value={query}
              onChange={e => handleQuery(e.target.value)}
              aria-label="Search locations"
            />
            {query && (
              <button className={styles.clearSearch} type="button" onClick={() => handleQuery('')} aria-label="Clear search">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            className={styles.filterSelect}
            value={brandFilter}
            onChange={e => handleBrandFilter(e.target.value)}
            aria-label="Filter by brand"
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.display_name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={styles.emptyIcon} aria-hidden>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <p className={styles.emptyText}>{query || brandFilter ? 'No locations match your filters' : 'No locations yet'}</p>
            <p className={styles.emptyHint}>{query || brandFilter ? 'Try adjusting your search.' : 'Add the first location using the button above.'}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Name / Store #</th>
                  <th>Address</th>
                  <th>Lease</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(loc => {
                  const b = brandMap[loc.brand]
                  const color = b?.color ?? '#555555'
                  return (
                    <tr key={loc.id}>
                      <td>
                        <span className={styles.brandBadge} style={{ background: color + '18', color, borderColor: color + '40' }}>
                          {b?.display_name ?? loc.brand}
                        </span>
                      </td>
                      <td>
                        <div className={styles.locName}>{loc.display_name}</div>
                        {loc.store_number && <div className={styles.locSub}>#{loc.store_number}</div>}
                      </td>
                      <td>
                        <div className={styles.locName}>{loc.address ?? '—'}</div>
                        <div className={styles.locSub}>{[loc.city, loc.state].filter(Boolean).join(', ') || '—'}</div>
                      </td>
                      <td>
                        <span className={`${styles.leaseBadge} ${loc.has_lease ? styles.leaseActive : styles.leasePending}`}>
                          {loc.has_lease ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          type="button"
                          aria-label={`Delete ${loc.display_name}`}
                          disabled={deletingId === loc.id}
                          onClick={() => setConfirmTarget({ id: loc.id, name: loc.display_name })}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              {start}–{end} of {filtered.length} {query || brandFilter ? 'results' : 'locations'}
            </span>
            <div className={styles.pageBtns}>
              <button className={styles.pageBtn} type="button" onClick={() => setPage(p => p - 1)} disabled={safePage === 1} aria-label="Previous page">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className={styles.pageCount}>{safePage} / {totalPages}</span>
              <button className={styles.pageBtn} type="button" onClick={() => setPage(p => p + 1)} disabled={safePage === totalPages} aria-label="Next page">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteError && (
        <div className={styles.dialogOverlay} onClick={() => setDeleteError('')}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal>
            <div className={styles.dialogIcon} style={{ background: '#fff3cd', color: '#856404' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className={styles.dialogTitle}>Delete failed</h3>
            <p className={styles.dialogBody}>{deleteError}</p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogConfirm} type="button" onClick={() => setDeleteError('')}>OK</button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <SlideOver title="Add Location" onClose={() => setAddOpen(false)}>
          <AddLocationForm onSuccess={() => { setAddOpen(false); router.refresh() }} />
        </SlideOver>
      )}

      {trashOpen && (
        <SlideOver title="Recycle Bin" onClose={() => setTrashOpen(false)}>
          <RecycleBin onRestore={() => { setTrashCount(c => Math.max(0, c - 1)); router.refresh() }} />
        </SlideOver>
      )}

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
            <h3 className={styles.dialogTitle}>Delete location?</h3>
            <p className={styles.dialogBody}>
              <strong>{confirmTarget.name}</strong> and all its lease data will be permanently removed. It can be restored from Trash within 60 days.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} type="button" onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button
                className={styles.dialogConfirm}
                type="button"
                onClick={async () => {
                  const { id } = confirmTarget
                  setConfirmTarget(null)
                  setDeletingId(id)
                  setDeleteError('')
                  try {
                    const res = await fetch(`/api/admin/locations?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
                    if (!res.ok) {
                      const json = await res.json().catch(() => ({}))
                      setDeleteError(json.error ?? 'Failed to delete location')
                      return
                    }
                    setTrashCount(c => c + 1)
                    router.refresh()
                  } catch {
                    setDeleteError('Network error — please try again')
                  } finally {
                    setDeletingId(null)
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Brands panel ───────────────────────────────────────────────────────

export function BrandsPanel({ brands, locationCounts }: { brands: AdminBrand[]; locationCounts: Record<string, number> }) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Brand list */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2 className={styles.cardTitle}>Brands</h2>
            <p className={styles.cardSub}>Franchise brand registry</p>
          </div>
          <span className={styles.countBadge}>{brands.length} brands</span>
        </div>

        {brands.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No brands yet</p>
            <p className={styles.emptyHint}>Add one using the form below.</p>
          </div>
        ) : (
          <ul className={styles.brandList}>
            {brands.map(b => (
              <li key={b.id} className={styles.brandItem}>
                <span className={styles.colorSwatch} style={{ background: b.color }} />
                <div className={styles.brandInfo}>
                  <span className={styles.brandName}>{b.display_name}</span>
                  <span className={styles.brandKey}>{b.id}</span>
                </div>
                <span className={styles.locCount}>{locationCounts[b.id] ?? 0} loc</span>
                <div className={styles.brandActions}>
                  <EditBrandButton id={b.id} name={b.display_name} color={b.color} onEdit={() => router.refresh()} />
                  <DeleteBrandButton id={b.id} name={b.display_name} count={locationCounts[b.id] ?? 0} onDelete={() => router.refresh()} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add brand form */}
      <AddBrandCard onSuccess={() => router.refresh()} />
    </div>
  )
}

// ── Delete brand button ────────────────────────────────────────────────

function DeleteBrandButton({ id, name, count, onDelete }: { id: string; name: string; count: number; onDelete: () => void }) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [blockedOpen, setBlockedOpen] = useState(false)

  function handleDeleteClick() {
    if (count > 0) {
      setBlockedOpen(true)
      return
    }
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    setConfirmOpen(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { setBlockedOpen(true); return }
      onDelete()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className={styles.deleteBtn} onClick={handleDeleteClick} disabled={loading} type="button" aria-label={`Delete ${name}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </button>

      {blockedOpen && (
        <div className={styles.dialogOverlay} onClick={() => setBlockedOpen(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal>
            <div className={styles.dialogIcon} style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#d97706' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className={styles.dialogTitle}>Brand has locations</h3>
            <p className={styles.dialogBody}>
              <strong>{count} location{count !== 1 ? 's' : ''}</strong> {count !== 1 ? 'are' : 'is'} still associated with <strong>{name}</strong>. Delete all locations first, then remove the brand.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} type="button" onClick={() => setBlockedOpen(false)} style={{ flex: 'unset', width: '100%' }}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className={styles.dialogOverlay} onClick={() => setConfirmOpen(false)}>
          <div className={styles.dialog} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal>
            <div className={styles.dialogIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className={styles.dialogTitle}>Delete brand?</h3>
            <p className={styles.dialogBody}>
              <strong>{name}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} type="button" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className={styles.dialogConfirm} type="button" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Edit brand button ──────────────────────────────────────────────────

function EditBrandButton({ id, name, color, onEdit }: { id: string; name: string; color: string; onEdit: () => void }) {
  const [editOpen, setEditOpen] = useState(false)
  const [displayName, setDisplayName] = useState(name)
  const [editColor, setEditColor] = useState(color)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openEdit() {
    setDisplayName(name)
    setEditColor(color)
    setError('')
    setEditOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/brands?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, color: editColor }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      setEditOpen(false)
      onEdit()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className={styles.editBtn} type="button" onClick={openEdit} aria-label={`Edit ${name}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      {editOpen && (
        <div className={styles.dialogOverlay} onClick={() => setEditOpen(false)}>
          <div className={`${styles.dialog} ${styles.dialogEdit}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-label="Edit brand">
            <div className={styles.dialogIcon} style={{ background: editColor + '22', borderColor: editColor + '55', color: editColor, alignSelf: 'flex-start' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h3 className={styles.dialogTitle}>Edit brand</h3>
            <form onSubmit={handleSave} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              <div>
                <label className={styles.dialogFormLabel}>Display Name <span className={styles.req}>*</span></label>
                <input
                  className={styles.dialogFormInput}
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={styles.dialogFormLabel}>Brand Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    style={{ width: 32, height: 32, border: '1.5px solid var(--border)', borderRadius: 6, padding: 2, cursor: 'pointer', background: '#fff', flexShrink: 0 }}
                  />
                  <input
                    className={styles.dialogFormInput}
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                  />
                </div>
              </div>
              <p className={styles.dialogFormNote}>Key: <code>{id}</code> — cannot be changed</p>
              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.dialogActions} style={{ marginTop: '.1rem' }}>
                <button className={styles.dialogCancel} type="button" onClick={() => setEditOpen(false)}>Cancel</button>
                <button className={styles.dialogSave} type="submit" disabled={loading || !displayName.trim()}>
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// ── Add brand card ─────────────────────────────────────────────────────

function AddBrandCard({ onSuccess }: { onSuccess: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState('#e2211c')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toSlug(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)
  }

  const brandKey = toSlug(displayName)

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
      setDisplayName('')
      setColor('#e2211c')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHead}>
        <h3 className={styles.formTitle}>Add Brand</h3>
        <p className={styles.formSub}>Register a new franchise brand.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Brand Name <span className={styles.req}>*</span></label>
          <input className={styles.input} value={displayName} onChange={e => setDisplayName(e.target.value)} required autoComplete="off" />
          {brandKey && <p className={styles.hint}>Key: <code style={{ fontFamily: 'ui-monospace, monospace' }}>{brandKey}</code></p>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Brand Color</label>
          <div className={styles.colorRow}>
            <input type="color" className={styles.colorSwatch} value={color} onChange={e => setColor(e.target.value)} />
            <input className={styles.input} value={color} onChange={e => setColor(e.target.value)} />
          </div>
        </div>
        {error && <p className={styles.errorMsg}>{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={loading || !brandKey}>
          {loading ? 'Adding...' : 'Add Brand'}
        </button>
      </form>
    </div>
  )
}
