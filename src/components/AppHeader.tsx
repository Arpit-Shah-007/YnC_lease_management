'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions'
import styles from './AppHeader.module.css'

type Props = {
  userEmail: string
}

const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Manage Users', href: '/admin/users' },
]

export function AppHeader({ userEmail }: Props) {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Image src="/yc-logo.png" alt="Y&C" width={36} height={36} className={styles.logoImg} />
          <span className={styles.logoText}>Lease Portal</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          <span className={styles.email}>{userEmail}</span>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
