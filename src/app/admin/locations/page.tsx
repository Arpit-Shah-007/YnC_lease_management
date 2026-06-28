import { redirect } from 'next/navigation'
import { getRole } from '@/lib/session'
import { createAdminClient } from '@/lib/supabase/admin'
import HomeHeader from '@/components/home/HomeHeader'
import Footer from '@/components/common/Footer'
import { LocationsTable, BrandsPanel } from './LocationsClient'
import styles from './page.module.css'

export type AdminBrand = { id: string; display_name: string; color: string }
export type AdminLocation = {
  id: string
  slug: string
  brand: string
  store_number: string | null
  display_name: string
  address: string | null
  city: string | null
  state: string | null
  has_lease: boolean
}

async function getData() {
  const supabase = createAdminClient()
  const [brandsRes, locsRes] = await Promise.all([
    supabase.from('brands').select('id, display_name, color').order('display_name'),
    supabase
      .from('locations')
      .select('id, slug, brand, store_number, display_name, address, city, state, leases(status)')
      .order('brand')
      .order('store_number'),
  ])

  const brands = (brandsRes.data ?? []) as AdminBrand[]
  const locations: AdminLocation[] = (locsRes.data ?? []).map((loc: Record<string, unknown>) => ({
    id: loc.id as string,
    slug: loc.slug as string,
    brand: loc.brand as string,
    store_number: loc.store_number as string | null,
    display_name: loc.display_name as string,
    address: loc.address as string | null,
    city: loc.city as string | null,
    state: loc.state as string | null,
    has_lease: Array.isArray(loc.leases) && loc.leases.length > 0,
  }))

  return { brands, locations }
}

export default async function ManageLocationsPage() {
  const role = await getRole()
  if (role !== 'admin') redirect('/')

  const { brands, locations } = await getData()

  const locationCounts = Object.fromEntries(
    brands.map(b => [b.id, locations.filter(l => l.brand === b.id).length])
  )

  return (
    <>
      <HomeHeader role={role} variant="locations" />
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <div className={styles.content}>
          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.title}>Manage Locations</h1>
              <p className={styles.sub}>Add and remove brands and locations.</p>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>{locations.length}</span>
                <span className={styles.statLabel}>Locations</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{brands.length}</span>
                <span className={styles.statLabel}>Brands</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>{locations.filter(l => l.has_lease).length}</span>
                <span className={styles.statLabel}>With Lease</span>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <LocationsTable locations={locations} brands={brands} />
            <BrandsPanel brands={brands} locationCounts={locationCounts} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
