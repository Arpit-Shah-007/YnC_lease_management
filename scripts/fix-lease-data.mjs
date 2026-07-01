/**
 * fix-lease-data.mjs
 * Applies rent_schedule and critical_dates corrections based on abstract PDF verification.
 * Run: node scripts/fix-lease-data.mjs
 * Note: wendys-7998 skipped — verification agent hit session limit; fix manually.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID as uuid } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nshdnjbtzkyugeodiotw.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var and re-run.')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const dump = JSON.parse(readFileSync(path.join(__dirname, '..', 'data', 'lease-dump.json'), 'utf8'))

function p(label, start, end, monthly, cam, sort) {
  return {
    id: uuid(), period_label: label, period_start: start, period_end: end,
    base_rent_monthly: monthly, base_rent_annual: +(monthly * 12).toFixed(2),
    cam_estimated_monthly: cam ?? null,
    total_monthly: +(monthly + (cam ?? 0)).toFixed(2),
    notes: null, sort_order: sort,
  }
}

function renew(date, days, notes) {
  return { id: uuid(), event_type: 'right_to_renew', event_date: date, notice_required_days: days, notes }
}

const FIXES = {
  'wendys-9549': {
    // rent_schedule already correct (3 periods); only missing renewal options 3 & 4
    critical_dates_add: [
      renew('2043-12-01', 365, '3rd auto-renewal; effective Jan 1, 2045'),
      renew('2048-12-01', 365, '4th auto-renewal; effective Jan 1, 2050'),
    ],
  },

  'wendys-11807': {
    critical_dates_add: [
      renew('2038-12-31', 92, '1st renewal (5-yr); effective Apr 1, 2039'),
      renew('2043-12-31', 92, '2nd renewal; effective Apr 1, 2044'),
      renew('2048-12-31', 92, '3rd renewal; effective Apr 1, 2049'),
      renew('2053-12-31', 92, '4th renewal; effective Apr 1, 2054'),
    ],
  },

  'wendys-2644': {
    cam_estimated_monthly: 950.00,
    // rent_schedule: flat (no steps), only prorated month 1 issue — acceptable
  },

  'wendys-2686': {
    base_rent_monthly: 13672.76,
    cam_estimated_monthly: 747.30,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2025-12-31', 13672.76, null, 1),
      p('Period 2', '2026-01-01', '2026-05-31', 14766.58, null, 2),
      p('Period 3', '2026-06-01', '2029-12-31', 14766.58, null, 3),
    ],
  },

  'tacobell-030685': {
    base_rent_monthly: 8784.60,
    rent_schedule: [
      p('Period 1', '2014-05-20', '2015-07-31', 8784.60, null, 1),
      p('Period 2', '2015-08-01', '2020-07-31', 9223.83, null, 2),
      p('Period 3', '2020-08-01', '2022-12-31', 9685.02, null, 3),
      p('Period 4', '2023-01-01', '2030-07-31', 8961.00, null, 4),
    ],
    critical_dates_add: [
      renew('2008-02-02', 180, '1st renewal; effective Aug 1, 2008'),
      renew('2013-02-01', 180, '2nd renewal; effective Aug 1, 2013'),
      renew('2018-02-01', 180, '3rd renewal; effective Aug 1, 2018'),
      renew('2023-02-01', 180, '4th renewal; effective Aug 1, 2023'),
    ],
  },

  'wendys-8612': {
    cam_estimated_monthly: 1725.00,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-12-31', 9888.47, null, 1),
      p('Period 2', '2027-01-01', '2030-12-31', 10679.55, null, 2),
    ],
  },

  // wendys-2230: only prorated first/last month — no material step-ups, skip

  'wendys-8616': {
    cam_estimated_monthly: 2252.90,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-12-31', 9658.92, null, 1),
      p('Period 2', '2027-01-01', '2031-12-31', 10818.00, null, 2),
    ],
  },

  'wendys-8617': {
    cam_estimated_monthly: 1252.58,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2027-12-31', 8750.00, null, 1),
      p('Period 2', '2028-01-01', '2031-12-31', 9450.00, null, 2),
    ],
  },

  'wendys-11858': {
    critical_dates_add: [
      renew('2031-10-31', 365, '1st renewal (5-yr); effective Nov 1, 2032'),
      renew('2036-10-31', 365, '2nd renewal; effective Nov 1, 2037'),
      renew('2041-10-31', 365, '3rd renewal (4yr 11mo); effective Nov 1, 2042'),
    ],
  },

  'wendys-12335': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2029-06-30', 8250.00, null, 1),
      p('Period 2', '2029-07-01', '2032-11-30', 9075.00, null, 2),
    ],
    critical_dates_add: [
      renew('2032-03-30', 274, '1st renewal (5-yr); effective Dec 31, 2032'),
      renew('2037-03-30', 274, '2nd renewal; effective Dec 31, 2037'),
      renew('2042-03-30', 274, '3rd renewal; effective Dec 31, 2042'),
    ],
  },

  'wendys-11389': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2027-12-31', 7562.50, null, 1),
      p('Period 2', '2028-01-01', '2034-01-31', 8318.75, null, 2),
    ],
    critical_dates_add: [
      renew('2050-01-01', 180, '1st renewal; effective Jul 1, 2050'),
      renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
      renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
      renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
    ],
  },

  'tacobell-041966': {
    base_rent_monthly: 9167.67,
    rent_schedule: [
      p('Year 1',  '2025-01-01', '2025-12-01', 9167.67,  null, 1),
      p('Year 2',  '2026-01-01', '2026-12-01', 9396.67,  null, 2),
      p('Year 3',  '2027-01-01', '2027-12-01', 9631.67,  null, 3),
      p('Year 4',  '2028-01-01', '2028-12-01', 9872.67,  null, 4),
      p('Year 5',  '2029-01-01', '2029-12-01', 10119.48, null, 5),
      p('Year 6',  '2030-01-01', '2030-12-01', 10372.47, null, 6),
      p('Year 7',  '2031-01-01', '2031-12-01', 10631.78, null, 7),
      p('Year 8',  '2032-01-01', '2032-12-01', 10897.57, null, 8),
      p('Year 9',  '2033-01-01', '2033-12-01', 11170.01, null, 9),
      p('Year 10', '2034-01-01', '2034-12-01', 11449.25, null, 10),
    ],
    critical_dates_add: [
      renew('2033-12-01', 365, '1st renewal (5-yr); effective Jan 1, 2035'),
      renew('2038-12-01', 365, '2nd renewal; effective Jan 1, 2040'),
      renew('2043-12-01', 365, '3rd renewal; effective Jan 1, 2045'),
      renew('2048-12-01', 365, '4th renewal; effective Jan 1, 2049'),
      { id: uuid(), event_type: 'rent_deposit_return', event_date: '2034-12-02', notice_required_days: null, notes: 'Rent deposit return per abstract' },
    ],
  },

  'wendys-2084': {
    cam_estimated_monthly: 1769.00,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2029-12-31', 14389.38, null, 1),
      p('Period 2', '2030-01-01', '2034-12-22', 15672.48, null, 2),
    ],
    critical_dates_add: [
      renew('2034-03-27', 270, '1st renewal (5-yr); effective Dec 23, 2034'),
      renew('2039-03-27', 270, '2nd renewal; effective Dec 23, 2039'),
    ],
  },

  'wendys-1400': {
    base_rent_monthly: 11567.64,
    cam_estimated_monthly: 1495.00,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2025-11-30', 11567.64, null, 1),
      p('Period 2', '2025-12-01', '2030-11-30', 12724.41, null, 2),
      p('Period 3', '2030-12-01', '2035-11-30', 13996.85, null, 3),
    ],
    critical_dates_add: [
      renew('2035-06-03', 180, 'Auto-renewal (9-yr); effective Dec 1, 2035'),
    ],
  },

  'wendys-455': {
    base_rent_monthly: 15022.77,
    cam_estimated_monthly: 1410.00,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2025-11-30', 15022.77, null, 1),
      p('Period 2', '2025-12-01', '2030-11-30', 16525.05, null, 2),
      p('Period 3', '2030-12-01', '2035-11-30', 18177.55, null, 3),
    ],
    critical_dates_add: [
      renew('2035-06-03', 180, 'Auto-renewal (9-yr); effective Dec 1, 2035'),
    ],
  },

  'wendys-13248': {
    base_rent_monthly: 10000.00,
    cam_estimated_monthly: 2181.09,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-02-28', 10000.00, null, 1),
      p('Period 2', '2026-03-01', '2031-02-28', 11000.00, null, 2),
      p('Period 3', '2031-03-01', '2036-02-28', 12100.00, null, 3),
    ],
    critical_dates_add: [
      renew('2035-02-28', 365, '1st renewal (5-yr); effective Mar 1, 2036'),
      renew('2040-02-28', 365, '2nd renewal; effective Mar 1, 2041'),
      renew('2045-02-28', 365, '3rd renewal; effective Mar 1, 2046'),
    ],
  },

  'wendys-2444': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-06-30', 14818.28, null, 1),
      p('Period 2', '2026-07-01', '2031-06-30', 16300.27, null, 2),
      p('Period 3', '2031-07-01', '2036-06-30', 17930.28, null, 3),
    ],
    critical_dates_add: [
      renew('2035-10-04', 270, '1st renewal (10-yr); effective Jul 1, 2036'),
    ],
  },

  'wendys-527': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-11-30', 6234.28, null, 1),
      p('Period 2', '2026-12-01', '2031-12-01', 6857.71, null, 2),
      p('Period 3', '2032-01-01', '2036-11-01', 7543.48, null, 3),
    ],
    critical_dates_add: [
      renew('2035-06-03', 180, 'Auto-renewal (9-yr); effective Dec 1, 2035'),
    ],
  },

  'wendys-11971': {
    cam_estimated_monthly: 944.69,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-12-31', 11000.00, null, 1),
      p('Period 2', '2027-01-01', '2030-12-31', 12100.00, null, 2),
      p('Period 3', '2031-01-01', '2036-12-20', 13310.00, null, 3),
    ],
    critical_dates_add: [
      renew('2036-06-20', 180, '1st renewal (5-yr); effective Dec 21, 2036'),
      renew('2041-06-20', 180, '2nd renewal (4yr 11mo); effective Dec 21, 2041'),
    ],
  },

  'wendys-11187': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2027-03-31', 14259.65, null, 1),
      p('Period 2', '2027-04-01', '2032-03-31', 15685.61, null, 2),
      p('Period 3', '2032-04-01', '2037-03-31', 17254.17, null, 3),
    ],
    critical_dates_add: [
      renew('2036-07-04', 270, '1st renewal (4yr 11mo); effective Apr 1, 2037'),
    ],
  },

  'wendys-11228': {
    cam_estimated_monthly: 2070.00,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2027-11-30', 8308.67, null, 1),
      p('Period 2', '2027-12-01', '2032-11-30', 9139.53, null, 2),
      p('Period 3', '2032-12-01', '2037-11-30', 10053.49, null, 3),
    ],
    critical_dates_add: [
      renew('2037-02-04', 270, '1st renewal (5-yr); effective Dec 1, 2037'),
    ],
  },

  'wendys-1879': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2026-12-31', 6034.08, null, 1),
      p('Period 2', '2027-01-01', '2032-12-31', 6837.49, null, 2),
      p('Period 3', '2033-01-01', '2037-12-31', 7501.24, null, 3),
    ],
    critical_dates_add: [
      renew('2036-12-31', 365, '1st renewal (5-yr); effective Jan 1, 2038'),
    ],
  },

  'tacobell-034804': {
    rent_schedule: [
      p('Period 1', '2018-02-15', '2022-12-31', 10000.00, null, 1),
      p('Period 2', '2023-01-01', '2038-02-28', 12156.41, null, 2),
    ],
    critical_dates_add: [
      renew('2037-05-15', 274, '1st renewal; effective Mar 1, 2038'),
      renew('2042-05-15', 274, '2nd renewal; effective Mar 1, 2043'),
      renew('2047-05-15', 274, '3rd renewal; effective Mar 1, 2048'),
      renew('2052-05-15', 274, '4th renewal; effective Mar 1, 2053'),
    ],
  },

  'wendys-11188': {
    cam_estimated_monthly: 3215.89,
    rent_schedule: [
      p('Period 1', '2025-06-02', '2029-03-31', 8316.67, null, 1),
      p('Period 2', '2029-04-01', '2034-03-31', 8873.33, null, 2),
      p('Period 3', '2034-04-01', '2039-03-31', 9760.67, null, 3),
    ],
    critical_dates_add: [
      renew('2038-07-04', 270, '1st renewal (4yr 11mo); effective Apr 1, 2039'),
    ],
  },

  'tacobell-040323': {
    base_rent_monthly: 12204.79,
    rent_schedule: [
      p('Months 1-6',   '2025-03-01', '2025-08-31', 12204.79, null, 1),
      p('Months 7-18',  '2025-09-01', '2026-08-31', 12448.88, null, 2),
      p('Months 19-30', '2026-09-01', '2027-08-31', 12697.86, null, 3),
      p('Months 31-42', '2027-09-01', '2028-08-31', 12951.82, null, 4),
      p('Months 43-54', '2028-09-01', '2029-08-31', 13210.85, null, 5),
      p('Months 55-66', '2029-09-01', '2030-08-31', 13475.07, null, 6),
      p('Months 67-78', '2030-09-01', '2031-08-31', 13744.57, null, 7),
      p('Months 79-90', '2031-09-01', '2032-08-31', 14019.46, null, 8),
      p('Months 91-102', '2032-09-01', '2033-08-31', 14299.85, null, 9),
      p('Months 103-114', '2033-09-01', '2034-08-31', 14585.85, null, 10),
      p('Months 115-126', '2034-09-01', '2035-08-31', 14877.57, null, 11),
      p('Months 127-138', '2035-09-01', '2036-08-31', 15175.12, null, 12),
      p('Months 139-150', '2036-09-01', '2037-08-31', 15478.62, null, 13),
      p('Months 151-162', '2037-09-01', '2038-08-31', 15788.19, null, 14),
      p('Months 163-174', '2038-09-01', '2039-08-31', 16103.95, null, 15),
      p('Months 175-186', '2039-09-01', '2040-08-31', 16426.03, null, 16),
      p('Months 187-198', '2040-09-01', '2041-08-31', 16754.55, null, 17),
    ],
  },

  'tacobell-038857': {
    base_rent_monthly: 7000.00,
    rent_schedule: [
      p('Free Rent', '2021-10-28', '2022-01-31', 0.00,    null, 1),
      p('Period 1',  '2022-02-01', '2022-12-31', 7000.00, null, 2),
      p('Period 2',  '2023-01-01', '2041-11-30', 8186.04, null, 3),
    ],
    critical_dates_add: [
      renew('2041-06-03', 180, '1st renewal (5-yr); effective Dec 1, 2041'),
      renew('2046-06-03', 180, '2nd renewal; effective Dec 1, 2046'),
      renew('2051-06-03', 180, '3rd renewal; effective Dec 1, 2051'),
    ],
  },

  'tacobell-040482': {
    // rent_schedule correct (flat NNN); only renewal options missing
    critical_dates_add: [
      renew('2042-10-03', 270, '1st renewal; effective Jul 1, 2043'),
      renew('2047-10-04', 270, '2nd renewal; effective Jul 1, 2048'),
      renew('2052-10-03', 270, '3rd renewal; effective Jul 1, 2053'),
      renew('2057-10-03', 270, '4th renewal; effective Jul 1, 2058'),
    ],
  },

  'wendys-13589': {
    rent_schedule: [
      p('Period 1', '2022-02-16', '2028-12-31', 7250.00,  null, 1),
      p('Period 2', '2029-01-01', '2034-01-31', 7975.00,  null, 2),
      p('Period 3', '2034-02-01', '2038-12-31', 8772.50,  null, 3),
      p('Period 4', '2039-01-01', '2043-12-31', 9649.75,  null, 4),
    ],
    critical_dates_add: [
      renew('2043-03-01', 274, '1st renewal (5-yr); effective Jan 1, 2044'),
      renew('2048-03-01', 274, '2nd renewal; effective Jan 1, 2049'),
      renew('2053-03-01', 274, '3rd renewal; effective Jan 1, 2054'),
      renew('2058-03-01', 274, '4th renewal; effective Jan 1, 2059'),
      { id: uuid(), event_type: 'right_to_terminate', event_date: '2026-04-29', notice_required_days: 90, notes: 'Termination right (Art. 50.01): gross sales below $850k in any 12-month period' },
    ],
  },

  'wendys-13569': {
    rent_schedule: [
      p('Yrs 1-5',   '2024-09-01', '2029-08-31', 8000.00,  null, 1),
      p('Yrs 6-10',  '2029-09-01', '2034-08-31', 8800.00,  null, 2),
      p('Yrs 11-15', '2034-09-01', '2039-08-31', 9680.00,  null, 3),
      p('Yrs 16-20', '2039-09-01', '2044-08-01', 10648.00, null, 4),
    ],
    critical_dates_add: [
      renew('2044-02-03', 180, '1st renewal; effective Aug 2, 2044'),
      renew('2049-02-02', 180, '2nd renewal; effective Aug 2, 2049'),
      renew('2054-02-02', 180, '3rd renewal; effective Aug 2, 2054'),
      renew('2059-02-02', 180, '4th renewal; effective Aug 2, 2059'),
    ],
  },

  'wendys-13406': {
    rent_schedule: [
      p('Yrs 1-10',  '2024-09-01', '2034-08-31', 11666.05, null, 1),
      p('Yrs 11-15', '2034-09-01', '2039-08-31', 12832.60, null, 2),
      p('Yrs 16-20', '2039-09-01', '2044-08-31', 14115.86, null, 3),
    ],
    critical_dates_add: [
      renew('2044-02-01', 183, '1st auto-renewal; effective Sep 1, 2044'),
      renew('2049-02-01', 183, '2nd auto-renewal; effective Sep 1, 2049'),
      renew('2054-02-01', 183, '3rd auto-renewal; effective Sep 1, 2054'),
      renew('2059-02-01', 183, '4th auto-renewal; effective Sep 1, 2059'),
      renew('2064-02-01', 183, '5th auto-renewal; effective Sep 1, 2064'),
    ],
  },

  'tacobell-040306': {
    // rent_schedule correct (flat); only renewal options missing
    critical_dates_add: [
      renew('2046-01-31', 273, '1st renewal (5-yr); effective Nov 1, 2046'),
      renew('2051-01-31', 273, '2nd renewal; effective Nov 1, 2051'),
      renew('2056-01-31', 273, '3rd renewal; effective Nov 1, 2056'),
      renew('2061-01-31', 273, '4th renewal; effective Nov 1, 2061'),
    ],
  },

  'wendys-10803': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2030-06-30', 13719.99, null, 1),
      p('Period 2', '2030-07-01', '2035-06-30', 15091.99, null, 2),
      p('Period 3', '2035-07-01', '2040-06-30', 16601.19, null, 3),
      p('Period 4', '2040-07-01', '2045-06-30', 18261.31, null, 4),
      p('Period 5', '2045-07-01', '2050-06-30', 20087.44, null, 5),
    ],
    critical_dates_add: [
      renew('2050-01-01', 180, '1st renewal; effective Jul 1, 2050'),
      renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
      renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
      renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
    ],
  },

  'wendys-8186': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2030-06-30', 9836.34,  null, 1),
      p('Period 2', '2030-07-01', '2035-06-30', 10819.97, null, 2),
      p('Period 3', '2035-07-01', '2040-06-30', 11901.97, null, 3),
      p('Period 4', '2040-07-01', '2045-06-30', 13092.17, null, 4),
      p('Period 5', '2045-07-01', '2050-06-30', 14401.38, null, 5),
    ],
    critical_dates_add: [
      renew('2050-01-01', 180, '1st renewal; effective Jul 1, 2050'),
      renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
      renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
      renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
    ],
  },

  'wendys-9530': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2030-06-30', 10835.14, null, 1),
      p('Period 2', '2030-07-01', '2035-06-30', 11918.65, null, 2),
      p('Period 3', '2035-07-01', '2040-06-30', 13110.52, null, 3),
      p('Period 4', '2040-07-01', '2045-06-30', 14421.57, null, 4),
      p('Period 5', '2045-07-01', '2050-06-30', 15863.72, null, 5),
    ],
    critical_dates_add: [
      renew('2050-01-01', 180, '1st renewal; effective Jul 1, 2050'),
      renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
      renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
      renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
    ],
  },

  'wendys-5327': {
    rent_schedule: [
      p('Period 1', '2025-06-02', '2030-06-30', 18547.92, null, 1),
      p('Period 2', '2030-07-01', '2035-06-30', 20402.72, null, 2),
      p('Period 3', '2035-07-01', '2040-06-30', 22442.99, null, 3),
      p('Period 4', '2040-07-01', '2045-06-30', 24687.29, null, 4),
      p('Period 5', '2045-07-01', '2050-06-30', 27156.01, null, 5),
    ],
    critical_dates_add: [
      renew('2050-01-02', 180, '1st renewal; effective Jul 1, 2050'),
      renew('2055-01-01', 180, '2nd renewal; effective Jul 1, 2055'),
      renew('2060-01-01', 180, '3rd renewal; effective Jul 1, 2060'),
      renew('2065-01-01', 180, '4th renewal; effective Jul 1, 2065'),
    ],
  },
}

async function main() {
  const slugs = Object.keys(FIXES)
  let ok = 0, err = 0

  for (const slug of slugs) {
    const fix = FIXES[slug]
    const entry = dump[slug]
    if (!entry?.lease) { console.error(`[SKIP] ${slug}: no lease found in dump`); continue }

    const leaseId = entry.lease.id
    const update = {}

    if (fix.base_rent_monthly !== undefined)    update.base_rent_monthly    = fix.base_rent_monthly
    if (fix.cam_estimated_monthly !== undefined) update.cam_estimated_monthly = fix.cam_estimated_monthly
    if (fix.rent_schedule)                       update.rent_schedule         = fix.rent_schedule
    if (fix.critical_dates_add?.length) {
      const existing = entry.lease.critical_dates ?? []
      update.critical_dates = [...existing, ...fix.critical_dates_add]
    }

    if (!Object.keys(update).length) { console.log(`[SKIP] ${slug}: nothing to update`); continue }

    const { error } = await sb.from('leases').update(update).eq('id', leaseId)
    if (error) { console.error(`[ERROR] ${slug}: ${error.message}`); err++ }
    else { console.log(`[OK] ${slug}: ${Object.keys(update).join(', ')}`); ok++ }
  }

  console.log(`\nDone — ${ok} updated, ${err} errors`)
  console.log('Skipped: wendys-7998 (verification agent hit session limit — fix manually)')
}

main().catch(e => { console.error(e); process.exit(1) })
