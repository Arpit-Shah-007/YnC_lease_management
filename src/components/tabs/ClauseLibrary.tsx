'use client'

import { useState } from 'react'
import type { LeaseWithRelations } from '@/types/database'

type Props = { lease: LeaseWithRelations }

export default function ClauseLibrary({ lease }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const clauses = lease.clauses

  if (clauses.length === 0) {
    return <div className="empty-state">No clauses extracted yet.</div>
  }

  const types = Array.from(new Set(clauses.map(c => c.clause_type))).sort()

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {types.map(type => (
        <div key={type}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
            {type}
          </h3>
          {clauses.filter(c => c.clause_type === type).map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
              <button
                style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                type="button"
              >
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{c.title}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {c.page_reference ?? ''} {expanded === c.id ? '▲' : '▼'}
                </span>
              </button>
              {expanded === c.id && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
                  {c.content}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
