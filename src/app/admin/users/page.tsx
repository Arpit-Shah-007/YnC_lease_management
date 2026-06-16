import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRole } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
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

export default async function UsersPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/')

  const users = await getUsers()

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to dashboard
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.sub}>Manage who can access the lease portal.</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* User list */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>All Users</h2>
            <span className={styles.count}>{users.length}</span>
          </div>

          {users.length === 0 ? (
            <div className={styles.empty}>
              No users yet. Create one using the form on the right.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.nameCell}>{user.name ?? '—'}</div>
                      <div className={styles.emailCell}>{user.email}</div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[user.role as 'admin' | 'user']}`}>
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
          )}
        </div>

        {/* Add user form */}
        <AddUserForm />
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
