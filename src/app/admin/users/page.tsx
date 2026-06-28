import { redirect } from 'next/navigation'
import { getRole } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import HomeHeader from '@/components/home/HomeHeader'
import Footer from '@/components/common/Footer'
import { AddUserForm, DeleteUserButton } from './UsersClient'
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

export default async function UsersPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/')

  const users = await getUsers()

  return (
    <>
      <HomeHeader role={role} />
      <main style={{ flex: 1, background: 'var(--bg)', padding: '2.5rem 1.5rem 4rem' }}>
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
        {/* Users table */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>All Users</h2>
              <p className={styles.cardSub}>Team members with portal access</p>
            </div>
            <span className={styles.countBadge}>{users.length} {users.length === 1 ? 'member' : 'members'}</span>
          </div>

          {users.length === 0 ? (
            <div className={styles.empty}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.emptyIcon} aria-hidden>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p className={styles.emptyText}>No users yet</p>
              <p className={styles.emptyHint}>Create the first user using the form on the right.</p>
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
                  {users.map(user => (
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
                          {user.role === 'admin' ? (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z" />
                            </svg>
                          ) : null}
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
        </div>

        {/* Add user form */}
        <AddUserForm />
      </div>
      </main>
      <Footer />
    </>
  )
}
