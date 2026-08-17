'use client'

import { useState } from 'react'
import styles from './PropertyMap.module.css'

type Props = { address: string; mapsEmbedUrl: string }

export default function PropertyMap({ address, mapsEmbedUrl }: Props) {
  // Bumping the key forces the iframe to remount, reloading the embed back to its
  // original center/zoom — undoing any panning or zooming the user did. Scroll-wheel
  // zoom on the embed itself is untouched (native Google Maps behavior).
  const [remountKey, setRemountKey] = useState(0)
  const [recentering, setRecentering] = useState(false)

  function recenter() {
    setRecentering(true)
    setRemountKey(k => k + 1)
  }

  return (
    <div className={styles.wrap}>
      <iframe
        key={remountKey}
        src={mapsEmbedUrl}
        title={`Map of ${address}`}
        className={styles.mapFrame}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setRecentering(false)}
      />

      {recentering && (
        <div className={styles.recenterOverlay}>
          <div className={styles.recenterSpinner} />
          <span>Recentering...</span>
        </div>
      )}

      <button
        type="button"
        className={styles.recenterBtn}
        onClick={recenter}
        title="Recenter map"
        aria-label="Recenter map"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
