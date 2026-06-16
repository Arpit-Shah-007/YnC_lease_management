'use client'

import { useEffect } from 'react'
import styles from './MapModal.module.css'

type Props = { onClose: () => void }

export default function MapModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.root} role="dialog" aria-modal aria-label="Locations map">
      <iframe
        src="/portfolio-map.html"
        className={styles.frame}
        title="Portfolio locations map"
        loading="eager"
      />
      <div className={styles.bar}>
        <div className={styles.legend}>
          <span className={styles.dot} style={{ background: '#e2211c' }} /> Wendy&apos;s
          <span className={styles.dot} style={{ background: '#702082', marginLeft: '10px' }} /> Taco Bell
          <span className={styles.note}>Larger dot = active lease</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close map">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>
    </div>
  )
}
