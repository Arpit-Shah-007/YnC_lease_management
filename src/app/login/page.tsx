'use client'

import { useActionState, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { loginAction } from './actions'
import styles from './page.module.css'

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null)
  const searchParams = useSearchParams()
  const didReset = searchParams.get('reset') === '1'
  const [email, setEmail] = useState('')
  const [dismissed, setDismissed] = useState(false)

  // Reveal banners again whenever a fresh server response arrives
  useEffect(() => { setDismissed(false) }, [state])

  function handleChange() { setDismissed(true) }

  return (
    <div className={styles.right}>
      <h1 className={styles.heading}>Welcome back</h1>
      <p className={styles.sub}>Sign in to access your lease dashboard</p>

      {!dismissed && didReset && (
        <p className={styles.success} role="status">
          Password updated. Sign in with your new password.
        </p>
      )}

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
            value={email}
            onChange={e => { setEmail(e.target.value); handleChange() }}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.passwordRow}>
            <label className={styles.label} htmlFor="password">Password</label>
            <Link href="/forgot-password" className={styles.forgotLink} tabIndex={-1}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            onChange={handleChange}
          />
        </div>

        {!dismissed && state?.error && (
          <p className={styles.error} role="alert">{state.error}</p>
        )}

        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
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

      {/* Right — form (Suspense required for useSearchParams) */}
      <Suspense fallback={<div className={styles.right} />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
