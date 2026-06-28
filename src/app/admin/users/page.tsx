import { redirect } from 'next/navigation'
import { getRole } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import HomeHeader from '@/components/home/HomeHeader'
import Footer from '@/components/common/Footer'
import { UsersTable, AddUserForm } from './UsersClient'
import styles from './page.module.css'

type AppUser = {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
}

async function getUsers(): Promise<AppUser[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: true })
    if (error) return []
    return (data ?? []) as AppUser[]
  } catch {
    return []
  }
}

export default async function UsersPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/')

  const users = await getUsers()

  return (
    <>
      <HomeHeader role={role} variant="users" />
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.title}>Manage Users</h1>
              <p className={styles.sub}>Control who can access the Y&amp;C lease portal.</p>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>{users.length}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{users.filter(u => u.role === 'admin').length}</span>
                <span className={styles.statLabel}>Admins</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{users.filter(u => u.role === 'user').length}</span>
                <span className={styles.statLabel}>Users</span>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <UsersTable users={users} />
            <AddUserForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
