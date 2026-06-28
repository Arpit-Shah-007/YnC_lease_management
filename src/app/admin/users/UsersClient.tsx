'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

type User = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
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
