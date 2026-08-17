import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildKpiTiles } from '@/lib/leaseKpis'
import { criticalDate, dateOffset, lease, rentPeriod } from './fixtures'

function tile(lse: Parameters<typeof buildKpiTiles>[0], label: string) {
  const found = buildKpiTiles(lse).find(t => t.label === label)
  assert.ok(found, `no tile labelled ${label}`)
  return found
}

describe('buildKpiTiles', () => {
  it('always produces the full twelve-tile grid', () => {
    assert.equal(buildKpiTiles(lease()).length, 12)
  })

  it('renders lease dates on their true calendar day', () => {
    const lse = lease({
      commencement_date: '2020-03-15',
      expiry_date: '2030-03-14',
      execution_date: '2020-02-01',
    })
    assert.equal(tile(lse, 'Commencement').value, 'Mar 15, 2020')
    assert.equal(tile(lse, 'Expiry').value, 'Mar 14, 2030')
    assert.equal(tile(lse, 'Execution Date').value, 'Feb 1, 2020')
  })

  it('uses the -- placeholder for missing dates', () => {
    const lse = lease({ commencement_date: null, expiry_date: null, execution_date: null })
    assert.equal(tile(lse, 'Commencement').value, '--')
    assert.equal(tile(lse, 'Expiry').value, '--')
    assert.equal(tile(lse, 'Execution Date').value, '--')
  })

  it('shows the rent for the period covering today', () => {
    const lse = lease({
      rent_schedule: [
        rentPeriod({ id: 'old', base_rent_monthly: 1000, period_start: dateOffset(-400), period_end: dateOffset(-40) }),
        rentPeriod({ id: 'now', base_rent_monthly: 2500, period_start: dateOffset(-10), period_end: dateOffset(10) }),
      ],
    })
    assert.equal(tile(lse, 'Monthly Rent').value, '$2,500.00')
    assert.equal(tile(lse, 'Annual Rent').value, '$30,000.00')
  })

  it('marks a lapsed lease as expired rather than showing negative months', () => {
    const lse = lease({ expiry_date: dateOffset(-30) })
    assert.equal(tile(lse, 'Remaining').value, 'Expired')
  })

  it('reports remaining term for a live lease', () => {
    const lse = lease({ expiry_date: dateOffset(365) })
    assert.equal(tile(lse, 'Remaining').value, '12 months')
  })

  it('prefers the stated term length over one derived from the dates', () => {
    const lse = lease({
      term_length_months: 240,
      commencement_date: '2020-01-01',
      expiry_date: '2030-01-01',
    })
    assert.equal(tile(lse, 'Lease Term').value, '240 months')
    assert.equal(tile(lse, 'Lease Term').sub, '20.0 years')
  })

  it('derives the term from the dates when no length is stated', () => {
    const lse = lease({
      term_length_months: null,
      commencement_date: '2020-01-01',
      expiry_date: '2030-01-01',
    })
    assert.equal(tile(lse, 'Lease Term').value, '120 months')
  })

  it('formats GLA with its unit and falls back when absent', () => {
    assert.equal(tile(lease({ square_footage: 2400, area_unit: 'SF' }), 'GLA').value, '2,400 SF')
    assert.equal(tile(lease({ square_footage: 2400, area_unit: null }), 'GLA').value, '2,400 SF')
    assert.equal(tile(lease({ square_footage: null }), 'GLA').value, '--')
  })

  it('counts renewal options and singularises the label', () => {
    const one = lease({ critical_dates: [criticalDate({ event_type: 'right_to_renew' })] })
    assert.equal(tile(one, 'Renewal Options').value, '1 Option')

    const two = lease({
      critical_dates: [
        criticalDate({ id: 'a', event_type: 'right_to_renew' }),
        criticalDate({ id: 'b', event_type: 'renewal_deadline' }),
      ],
    })
    assert.equal(tile(two, 'Renewal Options').value, '2 Options')
  })

  it('ignores critical dates that are not renewal events', () => {
    const lse = lease({ critical_dates: [criticalDate({ event_type: 'insurance_renewal' })] })
    assert.equal(tile(lse, 'Renewal Options').value, '--')
  })

  it('surfaces the notice period from the first renewal date', () => {
    const lse = lease({
      critical_dates: [criticalDate({ event_type: 'renewal_deadline', notice_required_days: 180 })],
    })
    assert.equal(tile(lse, 'Renewal Options').sub, '180-day cancellation notice')
  })

  it('shows pro-rata share to two decimals, or a per-lease note', () => {
    assert.equal(tile(lease({ pro_rata_share: 12.3456 }), 'Pro-Rata Share').value, '12.35%')
    assert.equal(tile(lease({ pro_rata_share: null }), 'Pro-Rata Share').value, 'Per Lease')
  })

  it('formats the security deposit as money', () => {
    assert.equal(tile(lease({ security_deposit: 15000 }), 'Security Deposit').value, '$15,000.00')
    assert.equal(tile(lease({ security_deposit: null }), 'Security Deposit').value, '--')
  })
})
