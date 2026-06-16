'use client'

import { useState } from 'react'
import type { Location, LeaseWithRelations } from '@/types/database'
import CamAudit from '@/components/tabs/CamAudit'
import RentSchedule from '@/components/tabs/RentSchedule'
import DatesOptions from '@/components/tabs/DatesOptions'
import AdditionalRent from '@/components/tabs/AdditionalRent'
import ClauseLibrary from '@/components/tabs/ClauseLibrary'
import styles from './TabNav.module.css'

type TabId = 'cam' | 'additional' | 'clauses' | 'rent' | 'dates'

const TABS: { id: TabId; label: string; primary?: boolean }[] = [
  { id: 'cam',        label: 'CAM / Operating Expense Audit', primary: true },
  { id: 'additional', label: 'Additional Rent' },
  { id: 'clauses',    label: 'Clause Library' },
  { id: 'rent',       label: 'Rent Schedule' },
  { id: 'dates',      label: 'Dates & Options' },
]

type Props = {
  location: Location
  lease: LeaseWithRelations
}

export default function TabNav({ location, lease }: Props) {
  const [active, setActive] = useState<TabId>('cam')

  const camClause = lease.clauses.find(c =>
    c.clause_type.toLowerCase().includes('cam') && c.page_reference
  )
  const citation = active === 'cam' && camClause?.page_reference
    ? `Lease ${camClause.page_reference}`
    : null

  return (
    <div className={styles.wrap}>
      <div className={styles.navRow}>
        <nav className={styles.nav}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${active === t.id ? styles.tabActive : ''}`}
              onClick={() => setActive(t.id)}
              type="button"
            >
              {t.primary && active === t.id && (
                <span className={styles.primaryBadge}>PRIMARY</span>
              )}
              {t.label}
            </button>
          ))}
        </nav>
        {citation && <span className={styles.citation}>{citation}</span>}
      </div>

      <div className={`card ${styles.panel}`}>
        {active === 'cam'        && <CamAudit       lease={lease} />}
        {active === 'additional' && <AdditionalRent  lease={lease} location={location} />}
        {active === 'clauses'    && <ClauseLibrary   lease={lease} />}
        {active === 'rent'       && <RentSchedule    lease={lease} />}
        {active === 'dates'      && <DatesOptions     lease={lease} />}
      </div>
    </div>
  )
}
