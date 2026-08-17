'use client'

import { useMemo, useState } from 'react'
import type { Clause, LeaseWithRelations } from '@/types/database'
import { humanizeClauseType } from '@/lib/camAudit'
import styles from './ClauseLibrary.module.css'

type Props = { lease: LeaseWithRelations }

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width="11" height="11" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export default function ClauseLibrary({ lease }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const clauses = lease.clauses

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim()
    const matching = q
      ? clauses.filter(c =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          humanizeClauseType(c.clause_type).toLowerCase().includes(q)
        )
      : clauses

    const byType = new Map<string, Clause[]>()
    for (const c of matching) {
      const list = byType.get(c.clause_type)
      if (list) list.push(c)
      else byType.set(c.clause_type, [c])
    }

    return [...byType.entries()]
      .map(([type, items]) => ({ type, label: humanizeClauseType(type), items }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [clauses, query])

  const matchCount = groups.reduce((n, g) => n + g.items.length, 0)
  const allExpanded = matchCount > 0 && matchCount === expanded.size

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setExpanded(allExpanded
      ? new Set()
      : new Set(groups.flatMap(g => g.items.map(i => i.id))))
  }

  if (clauses.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No clauses extracted for this lease</p>
        <p className={styles.emptyHint}>
          Clauses are pulled out of the lease PDF during AI extraction. Re-upload the lease
          document to populate this library, the CAM cap, and the permitted/excluded expense
          lists on the CAM Charges tab.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search clauses..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search clauses"
          />
        </div>

        <span className={styles.count}>
          {query
            ? `${matchCount} of ${clauses.length} ${clauses.length === 1 ? 'clause' : 'clauses'}`
            : `${clauses.length} ${clauses.length === 1 ? 'clause' : 'clauses'}`}
        </span>

        {matchCount > 0 && (
          <button type="button" className={styles.expandAll} onClick={toggleAll}>
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      {matchCount === 0 ? (
        <p className={styles.noResults}>No clauses match &ldquo;{query}&rdquo;.</p>
      ) : (
        groups.map(group => (
          <div key={group.type} className={styles.group}>
            <div className={styles.groupHead}>
              <h3 className={styles.groupTitle}>{group.label}</h3>
              <span className={styles.groupCount}>{group.items.length}</span>
            </div>

            {group.items.map(clause => {
              const open = expanded.has(clause.id)
              return (
                <div key={clause.id} className={styles.clause}>
                  <button
                    type="button"
                    className={styles.clauseBtn}
                    onClick={() => toggle(clause.id)}
                    aria-expanded={open}
                  >
                    <Chevron open={open} />
                    <span className={styles.clauseTitle}>{clause.title}</span>
                    {clause.page_reference && (
                      <span className={styles.pageRef}>{clause.page_reference}</span>
                    )}
                  </button>
                  {open && <p className={styles.content}>{clause.content}</p>}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
