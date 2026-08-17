export type LeaseStatus = 'active' | 'expired' | 'pending'

export type Brand = {
  id: string
  display_name: string
  color: string
  created_at: string
}

export type Location = {
  id: string
  slug: string
  brand: string
  store_number: string | null
  display_name: string
  short_name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  coming_soon: boolean
  maps_url: string | null
  lat: number | null
  lng: number | null
  lease_id: string | null
  created_at: string
}

export type RentScheduleEntry = {
  id: string
  period_label: string | null
  period_start: string | null
  period_end: string | null
  base_rent_monthly: number | null
  base_rent_annual: number | null
  cam_estimated_monthly: number | null
  total_monthly: number | null
  notes: string | null
  sort_order: number
}

export type CriticalDate = {
  id: string
  event_type: string
  event_date: string | null
  notice_required_days: number | null
  notes: string | null
}

export type Clause = {
  id: string
  clause_type: string
  title: string
  content: string
  page_reference: string | null
  created_at: string
}

export type CamLineItem = {
  id: string
  year: number
  category: string
  landlord_billed: number | null
  tenant_share: number | null
  notes: string | null
}

export type LeaseFile = {
  id: string
  file_name: string
  storage_bucket: string
  storage_path: string
  file_size_bytes: number | null
  mime_type: string | null
  uploaded_at: string
}

export type CamDocType = 'estimate' | 'reconciliation'

export type CamDocument = {
  id: string
  year: number
  doc_type: CamDocType
  file_name: string
  storage_bucket: string
  storage_path: string
  file_size_bytes: number | null
  uploaded_at: string
}

export type CamVerdict = 'ok' | 'high' | 'low'

export type CamYearVerdict = {
  year: number
  verdict: CamVerdict
  actual_total: number | null
  estimate_total: number | null
  cap_amount: number | null
  explanation: string
  flagged_items: string[]
  computed_at: string
}

export type Lease = {
  id: string
  location_id: string
  lessee: string | null
  lessor: string | null
  possession_date: string | null
  commencement_date: string | null
  expiry_date: string | null
  execution_date: string | null
  rent_commencement_date: string | null
  original_commencement_date: string | null
  last_amended_date: string | null
  term_type: string | null
  rent_structure: string | null
  term_length_months: number | null
  square_footage: number | null
  area_unit: string | null
  space_type: string | null
  base_rent_monthly: number | null
  cam_estimated_monthly: number | null
  pro_rata_share: number | null
  security_deposit: number | null
  status: LeaseStatus
  extracted_at: string | null
  created_at: string
  rent_schedule: RentScheduleEntry[]
  critical_dates: CriticalDate[]
  clauses: Clause[]
  cam_line_items: CamLineItem[]
  lease_files: LeaseFile[]
  cam_documents: CamDocument[]
  cam_year_verdicts: CamYearVerdict[]
}

export type LeaseWithRelations = Lease

export type LocationWithLease = Location & {
  lease: Lease | null
}

export type LeaseExtractionResult = {
  lessee: string | null
  lessor: string | null
  possession_date: string | null
  commencement_date: string | null
  expiry_date: string | null
  execution_date: string | null
  rent_commencement_date: string | null
  original_commencement_date: string | null
  term_type: string | null
  rent_structure: string | null
  term_length_months: number | null
  square_footage: number | null
  area_unit: string | null
  space_type: string | null
  base_rent_monthly: number | null
  cam_estimated_monthly: number | null
  pro_rata_share: number | null
  security_deposit: number | null
  rent_schedule: Array<{
    period_label: string
    period_start: string | null
    period_end: string | null
    base_rent_monthly: number | null
    cam_estimated_monthly: number | null
    notes: string | null
  }>
  critical_dates: Array<{
    event_type: string
    event_date: string | null
    notice_required_days: number | null
    notes: string | null
  }>
  clauses: Array<{
    clause_type: string
    title: string
    content: string
    page_reference: string | null
  }>
  cam_line_items: Array<{
    year: number
    category: string
    landlord_billed: number | null
    tenant_share: number | null
    notes: string | null
  }>
}
