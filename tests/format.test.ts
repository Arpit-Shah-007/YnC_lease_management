import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fmtDate, fmtMoney } from '@/lib/format'

describe('fmtMoney', () => {
  it('renders an em dash for null', () => {
    assert.equal(fmtMoney(null), '—')
  })

  it('always shows two decimal places', () => {
    assert.equal(fmtMoney(1000), '$1,000.00')
    assert.equal(fmtMoney(1234.5), '$1,234.50')
  })

  it('rounds to cents rather than truncating', () => {
    assert.equal(fmtMoney(1234.567), '$1,234.57')
  })

  it('groups thousands', () => {
    assert.equal(fmtMoney(1234567.89), '$1,234,567.89')
  })

  it('renders zero as a value, not a placeholder', () => {
    assert.equal(fmtMoney(0), '$0.00')
  })

  it('keeps the sign on negatives', () => {
    assert.equal(fmtMoney(-500), '$-500.00')
  })
})

describe('fmtDate', () => {
  it('renders an em dash for null by default', () => {
    assert.equal(fmtDate(null), '—')
  })

  it('honours a custom placeholder', () => {
    assert.equal(fmtDate(null, '--'), '--')
  })

  // Regression: date-only columns rendered a day early in negative-offset timezones,
  // because 'YYYY-MM-DD' parses as UTC midnight but was then formatted locally.
  it('keeps the calendar date regardless of the host timezone', () => {
    assert.equal(fmtDate('2026-03-15'), 'Mar 15, 2026')
    assert.equal(fmtDate('2026-01-01'), 'Jan 1, 2026')
    assert.equal(fmtDate('2026-12-31'), 'Dec 31, 2026')
  })

  it('handles leap days', () => {
    assert.equal(fmtDate('2028-02-29'), 'Feb 29, 2028')
  })
})
