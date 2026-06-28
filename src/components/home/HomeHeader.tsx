import Image from 'next/image'
import Link from 'next/link'
import type { Role } from '@/lib/auth'
import ProfileMenu from './ProfileMenu'
import styles from './HomeHeader.module.css'

type Props = {
  role: Role
  variant?: 'users'
}

export default function HomeHeader({ role, variant }: Props) {
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
          <ProfileMenu role={role} variant={variant} />
        </div>
      </div>
    </header>
  )
}
