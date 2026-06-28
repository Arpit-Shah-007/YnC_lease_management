import HomeHeader from '@/components/home/HomeHeader'
import LocationsTable from '@/components/home/LocationsTable'
import Footer from '@/components/common/Footer'
import { getAllLocations, getDashboardBrands } from '@/lib/staticData'
import { getRole } from '@/lib/session'

export default async function HomePage() {
  const [locations, brands, role] = await Promise.all([
    getAllLocations(),
    getDashboardBrands(),
    getRole(),
  ])

  return (
    <>
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <HomeHeader role={role ?? 'user'} />
        <LocationsTable locations={locations} brands={brands} />
      </main>
      <Footer />
    </>
  )
}
