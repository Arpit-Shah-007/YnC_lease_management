import type { LeaseWithRelations, RentScheduleEntry } from '@/types/database'

export type CurrentRentPeriod = {
  period: RentScheduleEntry | null
  monthly: number | null
  cam: number | null
  annual: number | null
}

export function getCurrentRentPeriod(lease: LeaseWithRelations): CurrentRentPeriod {
  const now = new Date()
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

  const period = lease.rent_schedule.find(r => {
    if (!r.period_start || !r.period_end) return false
    return today >= new Date(r.period_start) && today <= new Date(r.period_end)
  }) ?? lease.rent_schedule[0] ?? null

  const monthly = period?.base_rent_monthly ?? lease.base_rent_monthly
  const cam = period?.cam_estimated_monthly ?? lease.cam_estimated_monthly
  const annual = period?.base_rent_annual ?? (monthly != null ? monthly * 12 : null)

  return { period, monthly, cam, annual }
}
