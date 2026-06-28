'use client'

import { useActionState, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { resetPasswordAction } from './actions'
import styles from './page.module.css'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPasswordAction, null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => { setDismissed(false) }, [state])

  function handleChange() { setDismissed(true) }

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
        <h1 className={styles.heading}>Set new password</h1>
        <p className={styles.sub}>Choose a strong password for your account.</p>

        <form className={styles.form} action={action}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">New password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className={styles.input}
              type="password"
              name="confirm"
              autoComplete="new-password"
              minLength={8}
              required
              onChange={handleChange}
            />
          </div>

          {!dismissed && state?.error && (
            <p className={styles.error} role="alert">{state.error}</p>
          )}

          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? 'Updating…' : 'Update password'}
          </button>

          <Link href="/login" className={styles.backLink}>Back to sign in</Link>
        </form>
      </div>
    </div>
  )
}
