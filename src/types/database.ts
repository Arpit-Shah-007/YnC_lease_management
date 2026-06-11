export type BrandType = 'wendys' | 'tacobell' | 'starbucks'
export type LeaseStatus = 'active' | 'expired' | 'pending'

export type Location = {
  id: string
  brand: BrandType
  store_number: string | null
  display_name: string
  short_name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  coming_soon: boolean
  maps_url: string | null
  created_at: string
}

export type Lease = {
  id: string
  location_id: string
  lessee: string | null
  lessor: string | null
  possession_date: string | null
  commencement_date: string | null
  expiry_date: string | null
  term_type: string | null
  square_footage: number | null
  base_rent_monthly: number | null
  cam_estimated_monthly: number | null
  pro_rata_share: number | null
  status: LeaseStatus
  extracted_at: string | null
  created_at: string
}

export type LeaseFile = {
  id: string
  lease_id: string | null
  location_id: string
  file_name: string
  storage_bucket: string
  storage_path: string
  file_size_bytes: number | null
  mime_type: string | null
  uploaded_at: string
}

export type CamLineItem = {
  id: string
  lease_id: string
  year: number
  category: string
  landlord_billed: number | null
  tenant_share: number | null
  notes: string | null
}

export type RentScheduleEntry = {
  id: string
  lease_id: string
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
  lease_id: string
  event_type: string
  event_date: string | null
  notice_required_days: number | null
  notes: string | null
}

export type Clause = {
  id: string
  lease_id: string
  clause_type: string
  title: string
  content: string
  page_reference: string | null
  created_at: string
}

export type LeaseWithRelations = Lease & {
  cam_line_items: CamLineItem[]
  rent_schedule: RentScheduleEntry[]
  critical_dates: CriticalDate[]
  clauses: Clause[]
}

export type LocationWithLease = Location & {
  lease: Lease | null
}

export type LeaseExtractionResult = {
  lessee: string | null
  lessor: string | null
  possession_date: string | null
  commencement_date: string | null
  expiry_date: string | null
  term_type: string | null
  square_footage: number | null
  base_rent_monthly: number | null
  cam_estimated_monthly: number | null
  pro_rata_share: number | null
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
