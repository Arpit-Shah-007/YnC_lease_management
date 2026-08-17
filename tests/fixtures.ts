import type {
  CamLineItem,
  Clause,
  CriticalDate,
  LeaseWithRelations,
  RentScheduleEntry,
} from '@/types/database'

/** Days offset from today, as a 'YYYY-MM-DD' string, matching Postgres `date` columns. */
export function dateOffset(days: number): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function rentPeriod(over: Partial<RentScheduleEntry> = {}): RentScheduleEntry {
  return {
    id: 'rp-1',
    period_label: 'Year 1',
    period_start: '2020-01-01',
    period_end: '2020-12-31',
    base_rent_monthly: 1000,
    base_rent_annual: null,
    cam_estimated_monthly: null,
    total_monthly: null,
    notes: null,
    sort_order: 0,
    ...over,
  }
}

export function clause(over: Partial<Clause> = {}): Clause {
  return {
    id: 'c-1',
    clause_type: 'other',
    title: 'Untitled',
    content: '',
    page_reference: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

export function camLineItem(over: Partial<CamLineItem> = {}): CamLineItem {
  return {
    id: 'cam-1',
    year: 2020,
    category: 'landscaping',
    landlord_billed: null,
    tenant_share: null,
    notes: null,
    ...over,
  }
}

export function criticalDate(over: Partial<CriticalDate> = {}): CriticalDate {
  return {
    id: 'cd-1',
    event_type: 'renewal_deadline',
    event_date: '2030-01-01',
    notice_required_days: null,
    notes: null,
    ...over,
  }
}

export function lease(over: Partial<LeaseWithRelations> = {}): LeaseWithRelations {
  return {
    id: 'lease-1',
    location_id: 'loc-1',
    lessee: 'Tenant LLC',
    lessor: 'Landlord LP',
    possession_date: null,
    commencement_date: '2020-01-01',
    expiry_date: '2030-01-01',
    execution_date: null,
    rent_commencement_date: null,
    original_commencement_date: null,
    last_amended_date: null,
    term_type: 'NNN',
    rent_structure: 'Base + CAM',
    term_length_months: null,
    square_footage: null,
    area_unit: null,
    space_type: null,
    base_rent_monthly: null,
    cam_estimated_monthly: null,
    pro_rata_share: null,
    security_deposit: null,
    status: 'active',
    extracted_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    rent_schedule: [],
    critical_dates: [],
    clauses: [],
    cam_line_items: [],
    lease_files: [],
    cam_documents: [],
    cam_year_verdicts: [],
    ...over,
  }
}
