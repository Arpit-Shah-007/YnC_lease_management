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
}

type LocationRow = Location & { leases: LeaseRow[] | null }

function toStaticLocation(loc: LocationRow): StaticLocation {
  const lease = loc.leases?.[0] ?? null
  const { leases: _leases, ...rest } = loc as LocationRow & { leases: unknown }
  void _leases
  return {
    ...(rest as Location),
    has_lease: lease != null,
    base_rent_monthly_current: lease?.base_rent_monthly ?? null,
    square_footage: lease?.square_footage ?? null,
  }
}

export async function getAllLocations(): Promise<StaticLocation[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*, leases(base_rent_monthly, square_footage, status)')
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
    .select('*, leases(base_rent_monthly, square_footage, status)')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return toStaticLocation(data as unknown as LocationRow)
}

export async function getLeaseForLocation(locationId: string): Promise<LeaseWithRelations | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('leases')
    .select('*, cam_line_items(*), rent_schedule(*), critical_dates(*), clauses(*)')
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
