'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { loginAction } from './actions'
import styles from './page.module.css'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null)

  return (
    <div className={styles.page}>
      {/* Left — background image with text */}
      <div className={styles.left}>
        <Image
          src="/login-bg.jpg"
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className={styles.bgOverlay} />

        <div className={styles.textBlock}>
          <span className={styles.logoTitle}>Yum and Chill</span>
          <span className={styles.logoSub}>Lease Management Portal</span>
        </div>

        <p className={styles.leftCopyright}>
          &copy; 2026 Yum and Chill. All rights reserved. &nbsp;&middot;&nbsp; Developed by CodeWithAppy
        </p>
      </div>

      {/* Right — form */}
      <div className={styles.right}>
        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.sub}>Sign in to access your lease dashboard</p>

        <form className={styles.form} action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && (
            <p className={styles.error} role="alert">{state.error}</p>
          )}

          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
