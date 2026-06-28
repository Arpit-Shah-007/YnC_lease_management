'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

type User = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
}

const PAGE_SIZE = 10

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Users table with search + pagination ──────────────────────────

export function UsersTable({ users }: { users: User[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      (u.name ?? '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [users, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const end = Math.min(safePage * PAGE_SIZE, filtered.length)

  function handleQuery(val: string) {
    setQuery(val)
    setPage(1)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h2 className={styles.cardTitle}>All Users</h2>
          <p className={styles.cardSub}>Team members with portal access</p>
        </div>
        <span className={styles.countBadge}>{users.length} {users.length === 1 ? 'member' : 'members'}</span>
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
            placeholder="Search by name or email..."
            value={query}
            onChange={e => handleQuery(e.target.value)}
            aria-label="Search users"
          />
          {query && (
            <button className={styles.clearSearch} type="button" onClick={() => handleQuery('')} aria-label="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={styles.emptyIcon} aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <p className={styles.emptyText}>{query ? 'No users match your search' : 'No users yet'}</p>
          <p className={styles.emptyHint}>{query ? `Try a different name or email.` : 'Create the first user using the form on the right.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.memberCell}>
                      <div className={`${styles.avatar} ${user.role === 'admin' ? styles.avatarAdmin : styles.avatarUser}`}>
                        {initials(user.name, user.email)}
                      </div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{user.name ?? '—'}</span>
                        <span className={styles.memberEmail}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role as 'admin' | 'user']}`}>
                      {user.role === 'admin' && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z" />
                        </svg>
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{fmtDate(user.created_at)}</td>
                  <td>
                    <DeleteUserButton user={user} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {start}–{end} of {filtered.length} {query ? 'results' : 'members'}
          </span>
          <div className={styles.pageBtns}>
            <button
              className={styles.pageBtn}
              type="button"
              onClick={() => setPage(p => p - 1)}
              disabled={safePage === 1}
              aria-label="Previous page"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className={styles.pageCount}>{safePage} / {totalPages}</span>
            <button
              className={styles.pageBtn}
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={safePage === totalPages}
              aria-label="Next page"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add user form ──────────────────────────────────────────────────

export function AddUserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create user')
      setName('')
      setEmail('')
      setPassword('')
      setRole('user')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHead}>
        <h3 className={styles.formTitle}>Add User</h3>
        <p className={styles.formSub}>Invite a team member to the portal.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Name <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Password <span className={styles.req}>*</span></label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Role <span className={styles.req}>*</span></label>
          <select className={styles.select} value={role} onChange={e => setRole(e.target.value as 'user' | 'admin')}>
            <option value="user">User — read only</option>
            <option value="admin">Admin — full access</option>
          </select>
        </div>
        {error && <p className={styles.errorMsg}>{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={loading || !name || !email || !password}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  )
}

// ── Delete button ──────────────────────────────────────────────────

export function DeleteUserButton({ user }: { user: User }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return
    setLoading(true)
    try {
      await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={styles.deleteBtn}
      onClick={handleDelete}
      disabled={loading}
      aria-label={`Delete ${user.email}`}
      type="button"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
      </svg>
    </button>
  )
}
