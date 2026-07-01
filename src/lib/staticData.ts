import { createAdminClient } from '@/lib/supabase/admin'
import type { Location, LeaseWithRelations } from '@/types/database'

export type StaticLocation = Location & {
  has_lease: boolean
  base_rent_monthly_current: number | null
  square_footage: number | null
}

export type DashboardBrand = {
  id: string
  display_name: string
  color: string
}

type LeaseRow = {
  base_rent_monthly: number | null
  square_footage: number | null
  status: string
  rent_schedule: Array<{
    period_start: string | null
    period_end: string | null
    base_rent_monthly: number | null
  }>
}

// PostgREST returns a single object (not array) when the FK has a UNIQUE constraint
type LocationRow = Location & { leases: LeaseRow | LeaseRow[] | null }

function getCurrentRent(lease: LeaseRow): number | null {
  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const activePeriod = lease.rent_schedule?.find(r => {
    if (!r.period_start || !r.period_end) return false
    return today >= new Date(r.period_start) && today <= new Date(r.period_end)
  })
  return activePeriod?.base_rent_monthly ?? lease.base_rent_monthly
}

function toStaticLocation(loc: LocationRow): StaticLocation {
  const raw = loc.leases
  const lease = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
  const { leases: _leases, ...rest } = loc as LocationRow & { leases: unknown }
  void _leases
  return {
    ...(rest as Location),
    has_lease: lease != null,
    base_rent_monthly_current: lease != null ? getCurrentRent(lease) : null,
    square_footage: lease?.square_footage ?? null,
  }
}

export async function getAllLocations(): Promise<StaticLocation[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*, leases(base_rent_monthly, square_footage, status, rent_schedule)')
    .order('brand')
    .order('store_number')

  if (error || !data) return []
  return (data as unknown as LocationRow[]).map(toStaticLocation)
}

export async function getDashboardBrands(): Promise<DashboardBrand[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('brands')
    .select('id, display_name, color')
    .order('display_name')
  return (data ?? []) as DashboardBrand[]
}

export async function getLocationBySlug(slug: string): Promise<StaticLocation | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*, leases(base_rent_monthly, square_footage, status, rent_schedule)')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return toStaticLocation(data as unknown as LocationRow)
}

export async function getLeaseForLocation(locationId: string): Promise<LeaseWithRelations | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('leases')
    .select('*')
    .eq('location_id', locationId)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as LeaseWithRelations
}

export async function getAllLocationSlugs(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('locations').select('slug')
  return (data ?? []).map((r: { slug: string }) => r.slug)
}
