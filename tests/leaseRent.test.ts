import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getCurrentRentPeriod } from '@/lib/leaseRent'
import { dateOffset, lease, rentPeriod } from './fixtures'

describe('getCurrentRentPeriod', () => {
  it('picks the period containing today', () => {
    const past = rentPeriod({
      id: 'past', base_rent_monthly: 1000,
      period_start: dateOffset(-400), period_end: dateOffset(-40),
    })
    const current = rentPeriod({
      id: 'current', base_rent_monthly: 2000,
      period_start: dateOffset(-30), period_end: dateOffset(30),
    })
    const future = rentPeriod({
      id: 'future', base_rent_monthly: 3000,
      period_start: dateOffset(40), period_end: dateOffset(400),
    })

    const result = getCurrentRentPeriod(lease({ rent_schedule: [past, current, future] }))

    assert.equal(result.period?.id, 'current')
    assert.equal(result.monthly, 2000)
  })

  // The UTC normalisation exists so a period starting or ending today still matches;
  // comparing a local `new Date()` against a UTC-parsed date drifted across the boundary.
  it('treats the first day of a period as inside it', () => {
    const period = rentPeriod({ period_start: dateOffset(0), period_end: dateOffset(30) })
    const result = getCurrentRentPeriod(lease({ rent_schedule: [period] }))
    assert.equal(result.period?.id, period.id)
    assert.equal(result.monthly, 1000)
  })

  it('treats the last day of a period as inside it', () => {
    const period = rentPeriod({ period_start: dateOffset(-30), period_end: dateOffset(0) })
    const result = getCurrentRentPeriod(lease({ rent_schedule: [period] }))
    assert.equal(result.period?.id, period.id)
  })

  it('falls back to the first period when none covers today', () => {
    const first = rentPeriod({
      id: 'first', base_rent_monthly: 1500,
      period_start: dateOffset(-400), period_end: dateOffset(-300),
    })
    const second = rentPeriod({
      id: 'second', base_rent_monthly: 1600,
      period_start: dateOffset(300), period_end: dateOffset(400),
    })

    const result = getCurrentRentPeriod(lease({ rent_schedule: [first, second] }))

    assert.equal(result.period?.id, 'first')
    assert.equal(result.monthly, 1500)
  })

  it('skips periods with missing bounds instead of matching them', () => {
    const open = rentPeriod({ id: 'open', period_start: null, period_end: null, base_rent_monthly: 999 })
    const current = rentPeriod({
      id: 'current', base_rent_monthly: 2500,
      period_start: dateOffset(-10), period_end: dateOffset(10),
    })

    const result = getCurrentRentPeriod(lease({ rent_schedule: [open, current] }))

    assert.equal(result.period?.id, 'current')
    assert.equal(result.monthly, 2500)
  })

  it('falls back to lease-level figures when the schedule is empty', () => {
    const result = getCurrentRentPeriod(lease({
      rent_schedule: [],
      base_rent_monthly: 4000,
      cam_estimated_monthly: 500,
    }))

    assert.equal(result.period, null)
    assert.equal(result.monthly, 4000)
    assert.equal(result.cam, 500)
    assert.equal(result.annual, 48000)
  })

  it('falls back to lease-level figures when the matched period leaves them null', () => {
    const period = rentPeriod({
      base_rent_monthly: null, cam_estimated_monthly: null,
      period_start: dateOffset(-10), period_end: dateOffset(10),
    })

    const result = getCurrentRentPeriod(lease({
      rent_schedule: [period],
      base_rent_monthly: 3300,
      cam_estimated_monthly: 700,
    }))

    assert.equal(result.monthly, 3300)
    assert.equal(result.cam, 700)
  })

  it('prefers an explicit annual figure over monthly x 12', () => {
    const period = rentPeriod({
      base_rent_monthly: 1000, base_rent_annual: 11400,
      period_start: dateOffset(-10), period_end: dateOffset(10),
    })

    const result = getCurrentRentPeriod(lease({ rent_schedule: [period] }))

    assert.equal(result.annual, 11400)
  })

  it('derives annual from monthly when no annual figure is given', () => {
    const period = rentPeriod({
      base_rent_monthly: 1000, base_rent_annual: null,
      period_start: dateOffset(-10), period_end: dateOffset(10),
    })

    const result = getCurrentRentPeriod(lease({ rent_schedule: [period] }))

    assert.equal(result.annual, 12000)
  })

  it('reports a null annual when no rent figure exists anywhere', () => {
    const result = getCurrentRentPeriod(lease({ rent_schedule: [], base_rent_monthly: null }))
    assert.equal(result.monthly, null)
    assert.equal(result.annual, null)
  })
})
