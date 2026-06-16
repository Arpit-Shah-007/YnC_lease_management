import type { StaticLocation } from '@/lib/staticData'
import type { LeaseWithRelations } from '@/types/database'
import styles from './LeaseHero.module.css'

type Props = {
  location: StaticLocation
  lease: LeaseWithRelations | null
}

export default function LeaseHero({ location, lease }: Props) {
  const fullAddress = [
    location.address,
    location.city,
    location.state,
    location.country ?? 'US',
    location.zip,
  ].filter(Boolean).join(', ')

  const mapsQuery = encodeURIComponent(
    `${location.address}, ${location.city}, ${location.state} ${location.zip}`
  )
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15`

  const isActive = lease?.status === 'active'

  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.mapCol}>
          <iframe
            src={mapsEmbedUrl}
            title={`Map of ${location.address}`}
            className={styles.mapFrame}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className={styles.infoCol}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusPending}`}>
              <span className={styles.statusDot} />
              {isActive ? 'Active' : lease ? 'Inactive' : 'No Lease'}
            </span>
          </div>

          <div className={styles.addressBlock}>
            <h1 className={styles.streetAddress}>{location.address}</h1>
            <p className={styles.cityLine}>
              {location.city}, {location.state}, {location.country ?? 'US'}, {location.zip}
            </p>
          </div>

          {lease ? (
            <div className={styles.leaseDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Term</span>
                <span className={styles.detailValue}>
                  {fmtDate(lease.commencement_date)} &mdash; {fmtDate(lease.expiry_date)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Lessee</span>
                <span className={styles.detailValue}>{lease.lessee ?? '--'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Lessor</span>
                <span className={styles.detailValue}>{lease.lessor ?? '--'}</span>
              </div>
            </div>
          ) : (
            <div className={styles.noLease}>
              <p>No lease data available for this location.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
