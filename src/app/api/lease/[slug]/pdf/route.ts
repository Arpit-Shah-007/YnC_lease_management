import { renderToBuffer } from '@react-pdf/renderer'
import { getLocationBySlug, getLeaseForLocation } from '@/lib/staticData'
import { getRole } from '@/lib/session'
import { buildStaticMapImage } from '@/lib/staticMap'
import { LeaseSummaryDocument } from '@/lib/pdf/LeaseSummaryDocument'
import { brandColor } from '@/lib/pdf/pdfStyles'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Reads run through the service-role client, which bypasses RLS, so this route must
  // check app_users membership itself instead of relying on the proxy session check.
  const role = await getRole()
  if (!role) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { slug } = await params

  const location = await getLocationBySlug(slug)
  if (!location) {
    return new Response('Location not found', { status: 404 })
  }

  const lease = await getLeaseForLocation(location.id)
  if (!lease) {
    return new Response('No lease data for this location', { status: 404 })
  }

  const mapImage = await buildStaticMapImage(location.lat, location.lng, brandColor(location.brand))

  const buffer = await renderToBuffer(
    LeaseSummaryDocument({ location, lease, mapImage })
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${location.slug}-lease-summary.pdf"`,
    },
  })
}
