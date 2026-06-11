import { createClient } from '@/lib/supabase/server'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import type { Location } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('brand')
    .order('store_number')

  const activeLocations = (locations ?? []) as Location[]
  const firstActive = activeLocations.find(l => !l.coming_soon)

  return (
    <main style={{ minHeight: '100vh' }}>
      <DashboardHeader
        locations={activeLocations}
        initialLocationId={firstActive?.id ?? null}
      />
    </main>
  )
}
