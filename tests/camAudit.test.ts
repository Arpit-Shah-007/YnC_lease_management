import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_CAM_CAP_PCT,
  computeAuditTerms,
  computeCamCapPct,
  computeCapRows,
  findAnnualRentForYear,
  findClause,
  parseListItems,
  parseNumber,
} from '@/lib/camAudit'
import { camLineItem, clause, rentPeriod } from './fixtures'

describe('findClause', () => {
  it('matches on clause_type', () => {
    const target = clause({ id: 'cap', clause_type: 'cam_cap', title: 'Expenses' })
    const found = findClause([clause(), target], 'cam_cap')
    assert.equal(found?.id, 'cap')
  })

  it('matches on title', () => {
    const target = clause({ id: 'cap', title: 'Operating Expense Cap' })
    const found = findClause([clause(), target], 'operating expense cap')
    assert.equal(found?.id, 'cap')
  })

  it('is case insensitive in both directions', () => {
    const target = clause({ id: 'cap', title: 'CAM CAP PROVISION' })
    assert.equal(findClause([target], 'cam cap')?.id, 'cap')
    assert.equal(findClause([target], 'CAM CAP')?.id, 'cap')
  })

  it('returns the first match when several clauses could hit', () => {
    const first = clause({ id: 'first', title: 'Audit Right' })
    const second = clause({ id: 'second', title: 'Audit Right Redux' })
    assert.equal(findClause([first, second], 'audit right')?.id, 'first')
  })

  it('returns null when nothing matches', () => {
    assert.equal(findClause([clause({ title: 'Parking' })], 'cam cap'), null)
  })

  it('returns null for an empty clause list', () => {
    assert.equal(findClause([], 'cam cap'), null)
  })

  it('does not search clause content', () => {
    const c = clause({ title: 'Parking', content: 'subject to a cam cap of 8%' })
    assert.equal(findClause([c], 'cam cap'), null)
  })
})

describe('parseNumber', () => {
  it('extracts the first capture group as a float', () => {
    assert.equal(parseNumber('capped at 7.5% annually', /(\d+(?:\.\d+)?)\s*%/), 7.5)
  })

  it('extracts integers', () => {
    assert.equal(parseNumber('capped at 8%', /(\d+(?:\.\d+)?)\s*%/), 8)
  })

  it('returns null when the pattern does not match', () => {
    assert.equal(parseNumber('no figure here', /(\d+(?:\.\d+)?)\s*%/), null)
  })
})

describe('parseListItems', () => {
  it('splits on newlines', () => {
    assert.deepEqual(parseListItems('roof\nparking\nsnow'), ['roof', 'parking', 'snow'])
  })

  it('splits on semicolons', () => {
    assert.deepEqual(parseListItems('roof; parking; snow'), ['roof', 'parking', 'snow'])
  })

  it('strips bullet markers and surrounding whitespace', () => {
    assert.deepEqual(parseListItems('- roof\n• parking\n*  snow\n· ice'), ['roof', 'parking', 'snow', 'ice'])
  })

  it('drops blank entries', () => {
    assert.deepEqual(parseListItems('roof\n\n   \nparking'), ['roof', 'parking'])
  })

  it('returns an empty array for empty input', () => {
    assert.deepEqual(parseListItems(''), [])
  })
})

describe('computeCamCapPct', () => {
  it('reads the percentage out of a cap clause', () => {
    const c = clause({ clause_type: 'cam_cap', title: 'CAM Cap', content: 'increases capped at 6% per year' })
    assert.equal(computeCamCapPct([c]), 6)
  })

  it('falls back to the default when no cap clause exists', () => {
    assert.equal(computeCamCapPct([clause({ title: 'Parking' })]), DEFAULT_CAM_CAP_PCT)
  })

  it('falls back to the default when the cap clause states no percentage', () => {
    const c = clause({ clause_type: 'cam_cap', title: 'CAM Cap', content: 'capped per the schedule' })
    assert.equal(computeCamCapPct([c]), DEFAULT_CAM_CAP_PCT)
  })

  it('defaults to 10 percent', () => {
    assert.equal(DEFAULT_CAM_CAP_PCT, 10)
  })
})

describe('computeCapRows', () => {
  it('derives annual rent from monthly when no annual figure is present', () => {
    const row = rentPeriod({ base_rent_monthly: 1000, base_rent_annual: null })
    const [result] = computeCapRows([row], [], 10)
    assert.equal(result.annual, 12000)
    assert.equal(result.cap, 1200)
  })

  it('prefers an explicit annual figure', () => {
    const row = rentPeriod({ base_rent_monthly: 1000, base_rent_annual: 11400 })
    const [result] = computeCapRows([row], [], 10)
    assert.equal(result.annual, 11400)
    assert.equal(result.cap, 1140)
  })

  it('sums tenant share across the period years', () => {
    const row = rentPeriod({ period_start: '2020-07-01', period_end: '2021-06-30', base_rent_annual: 12000 })
    const items = [
      camLineItem({ id: 'a', year: 2020, tenant_share: 400 }),
      camLineItem({ id: 'b', year: 2021, tenant_share: 500 }),
      camLineItem({ id: 'c', year: 2022, tenant_share: 900 }),
    ]

    const [result] = computeCapRows([row], items, 10)

    assert.equal(result.billed, 900)
    assert.equal(result.variance, -300)
  })

  it('treats a missing tenant share as zero rather than failing', () => {
    const row = rentPeriod({ base_rent_annual: 12000 })
    const items = [
      camLineItem({ id: 'a', year: 2020, tenant_share: null }),
      camLineItem({ id: 'b', year: 2020, tenant_share: 300 }),
    ]
    const [result] = computeCapRows([row], items, 10)
    assert.equal(result.billed, 300)
  })

  it('reports billed and variance as null when nothing was billed', () => {
    const row = rentPeriod({ base_rent_annual: 12000 })
    const [result] = computeCapRows([row], [], 10)
    assert.equal(result.billed, null)
    assert.equal(result.variance, null)
  })

  it('flags an overage as a positive variance', () => {
    const row = rentPeriod({ base_rent_annual: 12000 })
    const items = [camLineItem({ year: 2020, tenant_share: 2000 })]
    const [result] = computeCapRows([row], items, 10)
    assert.equal(result.cap, 1200)
    assert.equal(result.variance, 800)
  })

  it('yields a null cap when the period carries no rent figure', () => {
    const row = rentPeriod({ base_rent_monthly: null, base_rent_annual: null })
    const [result] = computeCapRows([row], [], 10)
    assert.equal(result.annual, null)
    assert.equal(result.cap, null)
  })

  it('ignores line items when the period has no bounds', () => {
    const row = rentPeriod({ period_start: null, period_end: null, base_rent_annual: 12000 })
    const items = [camLineItem({ year: 2020, tenant_share: 500 })]
    const [result] = computeCapRows([row], items, 10)
    assert.equal(result.billed, null)
  })

  it('returns one row per rent-schedule period', () => {
    const rows = computeCapRows([rentPeriod({ id: 'a' }), rentPeriod({ id: 'b' })], [], 10)
    assert.equal(rows.length, 2)
  })
})

describe('findAnnualRentForYear', () => {
  it('finds a period fully inside the year', () => {
    const row = rentPeriod({ period_start: '2020-01-01', period_end: '2020-12-31', base_rent_annual: 24000 })
    assert.equal(findAnnualRentForYear([row], 2020), 24000)
  })

  it('finds a period that straddles the year boundary', () => {
    const row = rentPeriod({ period_start: '2019-07-01', period_end: '2020-06-30', base_rent_annual: 24000 })
    assert.equal(findAnnualRentForYear([row], 2020), 24000)
  })

  it('derives annual rent from monthly when needed', () => {
    const row = rentPeriod({
      period_start: '2020-01-01', period_end: '2020-12-31',
      base_rent_monthly: 1500, base_rent_annual: null,
    })
    assert.equal(findAnnualRentForYear([row], 2020), 18000)
  })

  it('returns null when no period overlaps the year', () => {
    const row = rentPeriod({ period_start: '2018-01-01', period_end: '2018-12-31' })
    assert.equal(findAnnualRentForYear([row], 2020), null)
  })

  it('returns null for an empty schedule', () => {
    assert.equal(findAnnualRentForYear([], 2020), null)
  })

  it('skips periods with missing bounds', () => {
    const open = rentPeriod({ id: 'open', period_start: null, period_end: null, base_rent_annual: 999 })
    const real = rentPeriod({ period_start: '2020-01-01', period_end: '2020-12-31', base_rent_annual: 24000 })
    assert.equal(findAnnualRentForYear([open, real], 2020), 24000)
  })
})

describe('computeAuditTerms', () => {
  it('returns a row for every key term, matched or not', () => {
    const terms = computeAuditTerms([clause({ id: 'cap', clause_type: 'cam_cap', title: 'CAM Cap' })])
    assert.equal(terms.length, 8)
    assert.equal(terms.find(t => t.label === 'CAM CAP')?.clause?.id, 'cap')
    assert.equal(terms.find(t => t.label === 'ADMIN FEE')?.clause, null)
  })
})
