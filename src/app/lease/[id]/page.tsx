import { notFound } from 'next/navigation'
import LeaseHeader from '@/components/lease/LeaseHeader'
import LeaseHero from '@/components/lease/LeaseHero'
import LeaseKPITable from '@/components/lease/LeaseKPITable'
import LeaseDocuments from '@/components/lease/LeaseDocuments'
import TabNav from '@/components/dashboard/TabNav'
import Footer from '@/components/common/Footer'
import { getAllLocations, getLocationBySlug, getLeaseForLocation } from '@/lib/staticData'
import { getRole } from '@/lib/session'
import type { Location } from '@/types/database'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const locations = await getAllLocations()
  return locations.map(loc => ({ id: loc.slug }))
}

export default async function LeasePage({ params }: Props) {
  const { id } = await params
  const location = await getLocationBySlug(id)
  if (!location) notFound()

  const [lease, allLocations, role] = await Promise.all([
    getLeaseForLocation(location.id),
    getAllLocations(),
    getRole(),
  ])

  return (
    <>
      <main style={{ flex: 1, background: 'var(--bg)' }}>
        <style>{`:root { --accent: ${location.brand === 'tacobell' ? '#702082' : '#e2211c'}; }`}</style>

        <LeaseHeader
          currentLocation={location}
          allLocations={allLocations}
          hasLeaseFile={lease !== null}
        />

        <LeaseHero location={location} lease={lease} />

        {lease && (
          <>
            <LeaseKPITable lease={lease} />
            <TabNav location={location as Location} lease={lease} isAdmin={role === 'admin'} />
            <LeaseDocuments
              initialFiles={lease.lease_files}
              leaseId={lease.id}
              locationId={location.id}
              isAdmin={role === 'admin'}
            />
          </>
        )}

        {!lease && (
          <div className="empty-state">
            <p>No lease data uploaded for this location yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
