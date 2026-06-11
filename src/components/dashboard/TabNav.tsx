'use client'

import { useState } from 'react'
import type { Location, LeaseWithRelations } from '@/types/database'
import CamAudit from '@/components/tabs/CamAudit'
import RentSchedule from '@/components/tabs/RentSchedule'
import DatesOptions from '@/components/tabs/DatesOptions'
import AdditionalRent from '@/components/tabs/AdditionalRent'
import ClauseLibrary from '@/components/tabs/ClauseLibrary'
import styles from './TabNav.module.css'

type TabId = 'cam' | 'rent' | 'dates' | 'additional' | 'clauses'

const TABS: { id: TabId; label: string }[] = [
  { id: 'cam',        label: 'CAM Audit' },
  { id: 'rent',       label: 'Rent Schedule' },
  { id: 'dates',      label: 'Dates & Options' },
  { id: 'additional', label: 'Additional Rent' },
  { id: 'clauses',    label: 'Clause Library' },
]

type Props = {
  location: Location
  lease: LeaseWithRelations
}

export default function TabNav({ location, lease }: Props) {
  const [active, setActive] = useState<TabId>('cam')

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <nav className={styles.nav}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${active === t.id ? styles.tabActive : ''}`}
            onClick={() => setActive(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className={`card ${styles.panel}`}>
        {active === 'cam'        && <CamAudit        lease={lease} />}
        {active === 'rent'       && <RentSchedule    lease={lease} />}
        {active === 'dates'      && <DatesOptions    lease={lease} />}
        {active === 'additional' && <AdditionalRent  lease={lease} location={location} />}
        {active === 'clauses'    && <ClauseLibrary   lease={lease} />}
      </div>
    </div>
  )
}
