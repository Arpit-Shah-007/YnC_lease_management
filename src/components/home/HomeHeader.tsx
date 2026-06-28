import Image from 'next/image'
import Link from 'next/link'
import type { Role } from '@/lib/auth'
import ProfileMenu from './ProfileMenu'
import AdminActions from './AdminActions'
import styles from './HomeHeader.module.css'

type Props = {
  role: Role
  variant?: 'users'
}

export default function HomeHeader({ role, variant }: Props) {
  const isUsersPage = variant === 'users'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brandLink}>
          <div className={styles.logoWrap}>
            <Image src="/yc-logo.png" alt="Y&C" width={57} height={40} style={{ height: '40px', width: 'auto' }} priority />
          </div>
          <div className={styles.titles}>
            <span className={styles.title}>Yum and Chill</span>
            <span className={styles.subtitle}>Lease Management</span>
          </div>
        </Link>

        <div className={styles.actions}>
          {role === 'admin' && !isUsersPage && <AdminActions />}
          {role === 'admin' && !isUsersPage && (
            <Link href="/admin/users" className={styles.usersBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Users
            </Link>
          )}
          <ProfileMenu role={role} variant={variant} />
        </div>
      </div>
    </header>
  )
}
