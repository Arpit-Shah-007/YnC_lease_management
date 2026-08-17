import type { LeaseWithRelations } from '@/types/database'
import { buildKpiTiles } from '@/lib/leaseKpis'
import styles from './LeaseKPITable.module.css'

type Props = { lease: LeaseWithRelations }

export default function LeaseKPITable({ lease }: Props) {
  const kpis = buildKpiTiles(lease)

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {kpis.map(kpi => (
          <div key={kpi.label} className={styles.cell}>
            <div className={styles.cellLabel}>{kpi.label}</div>
            <div className={styles.cellValue}>{kpi.value}</div>
            {kpi.sub && <div className={styles.cellSub}>{kpi.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
