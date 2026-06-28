'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logoutAction } from '@/app/login/actions'
import type { Role } from '@/lib/auth'
import styles from './ProfileMenu.module.css'

const HOME_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const USERS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const LOCATIONS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

export default function ProfileMenu({ role, variant }: { role: Role; variant?: 'users' | 'locations' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isAdminPage = variant === 'users' || variant === 'locations'

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={styles.trigger}
        type="button"
        aria-label="Profile menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className={styles.menu}>
          <div className={styles.roleBadge}>
            {role === 'admin' ? 'Admin' : 'User'}
          </div>

          {isAdminPage ? (
            <Link href="/" className={styles.menuLink} onClick={() => setOpen(false)}>
              {HOME_ICON}
              Home
            </Link>
          ) : role === 'admin' && (
            <>
              <Link href="/admin/locations" className={styles.menuLink} onClick={() => setOpen(false)}>
                {LOCATIONS_ICON}
                Manage Locations
              </Link>
              <Link href="/admin/users" className={styles.menuLink} onClick={() => setOpen(false)}>
                {USERS_ICON}
                Manage Users
              </Link>
            </>
          )}

          <form action={logoutAction}>
            <button className={styles.signOut} type="submit">Sign out</button>
          </form>
        </div>
      )}
    </div>
  )
}
