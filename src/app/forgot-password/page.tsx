'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { forgotPasswordAction } from './actions'
import styles from './page.module.css'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null)

  return (
    <div className={styles.page}>
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

      <div className={styles.right}>
        <h1 className={styles.heading}>Reset password</h1>
        <p className={styles.sub}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {state?.success ? (
          <div className={styles.successBox}>
            <p className={styles.successText}>
              Check your inbox. If that email is registered you&apos;ll receive a reset link shortly.
            </p>
            <Link href="/login" className={styles.backLink}>Back to sign in</Link>
          </div>
        ) : (
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

            {state?.error && (
              <p className={styles.error} role="alert">{state.error}</p>
            )}

            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? 'Sending…' : 'Send reset link'}
            </button>

            <Link href="/login" className={styles.backLink}>Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  )
}
