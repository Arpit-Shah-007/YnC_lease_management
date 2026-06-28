import { createClient } from '@/lib/supabase/server'
import { AppHeader } from './AppHeader'
import styles from './AppShell.module.css'

type Props = {
  children: React.ReactNode
}

export async function AppShell({ children }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email ?? ''

  return (
    <div className={styles.shell}>
      <AppHeader userEmail={userEmail} />
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>Y&amp;C Lease Management</span>
          <span className={styles.footerCopy}>&copy; {new Date().getFullYear()} Yum &amp; Chill Franchise Group. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
