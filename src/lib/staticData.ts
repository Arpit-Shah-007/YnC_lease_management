import type { Location, LeaseWithRelations } from '@/types/database'
import locationsRaw from '@/data/locations.json'
import leasesRaw from '@/data/leases.json'

export type StaticLocation = Location & {
  has_lease: boolean
  base_rent_monthly_current: number | null
  square_footage: number | null
}

// The JSON id field is already slug-formatted (e.g. "wendys-9549")
// The Location type has both id and slug; for static data they're the same value.
type JsonLocation = {
  id: string
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
  has_lease: boolean
  base_rent_monthly_current: number | null
  square_footage: number | null
  maps_url: string | null
  lat: number | null
  lng: number | null
  created_at: string
}

function toStaticLocation(raw: JsonLocation): StaticLocation {
  return {
    ...raw,
    slug: raw.id,
  }
}

const allLocations: StaticLocation[] = (locationsRaw as JsonLocation[]).map(toStaticLocation)

// Index leases by location_id for O(1) lookup
const leasesByLocationId = new Map<string, LeaseWithRelations>(
  (leasesRaw as unknown as LeaseWithRelations[]).map(l => [l.location_id, l])
)

export async function getAllLocations(): Promise<StaticLocation[]> {
  return allLocations
}

export async function getLocationBySlug(slug: string): Promise<StaticLocation | null> {
  return allLocations.find(l => l.slug === slug) ?? null
}

export async function getLeaseForLocation(locationId: string): Promise<LeaseWithRelations | null> {
  return leasesByLocationId.get(locationId) ?? null
}

export async function getAllLocationSlugs(): Promise<string[]> {
  return allLocations.map(l => l.slug)
}
