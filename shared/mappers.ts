import type { APIEnvelope, DashboardSnapshot, NumberLike, PackageItem, UsageCardSnapshot, UsagePayload } from './types'

const toNumber = (value: NumberLike): number | null => {
  if (value == null || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const clamp01 = (value: number): number => {
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

const toUsageCardSnapshot = (usage: UsagePayload | null | undefined): UsageCardSnapshot | null => {
  const totalUsd = toNumber(usage?.total_quota)
  const remainingUsd = toNumber(usage?.remaining_quota)

  if (totalUsd == null || remainingUsd == null || totalUsd <= 0) {
    return null
  }

  const usedUsd = totalUsd - remainingUsd
  const usedPercentage = toNumber(usage?.used_percentage)
  const ratio = usedPercentage != null ? clamp01(usedPercentage / 100) : clamp01(usedUsd / totalUsd)

  return {
    remainingUsd,
    usedUsd,
    totalUsd,
    ratio
  }
}

const getExpiresAt = (item: PackageItem): string | null => {
  return item.expires_at ?? item.expire_at ?? item.end_at ?? null
}

const parseTimestamp = (value: string | null): number | null => {
  if (!value) {
    return null
  }

  const time = Date.parse(value)
  return Number.isFinite(time) ? time : null
}

const isActivePackage = (item: PackageItem): boolean => {
  const status = (item.package_status ?? '').toLowerCase()
  if (status === 'active') {
    return true
  }

  if (typeof item.is_active === 'boolean') {
    return item.is_active
  }

  const activeValue = toNumber(item.is_active as NumberLike)
  return activeValue === 1
}

const pickNearestExpiresAt = (packages: PackageItem[] | null | undefined): string | null => {
  if (!packages?.length) {
    return null
  }

  const now = Date.now()
  const parseable = packages
    .map(item => {
      const expiresAt = getExpiresAt(item)
      return {
        expiresAt,
        timestamp: parseTimestamp(expiresAt),
        active: isActivePackage(item)
      }
    })
    .filter(item => item.timestamp != null) as Array<{ expiresAt: string; timestamp: number; active: boolean }>

  const activeCurrent = parseable
    .filter(item => item.active && item.timestamp >= now)
    .sort((left, right) => left.timestamp - right.timestamp)

  if (activeCurrent.length > 0) {
    return activeCurrent[0].expiresAt
  }

  const nearest = parseable.sort((left, right) => left.timestamp - right.timestamp)
  return nearest[0]?.expiresAt ?? null
}

export const mapApiEnvelopeToDashboardSnapshot = (envelope: APIEnvelope): DashboardSnapshot => {
  const state = envelope.state

  return {
    remainingUsd:
      toNumber(state?.remaining_quota) ??
      toNumber(state?.userPackgeUsage?.remaining_quota) ??
      toNumber(state?.userPackgeUsage_week?.remaining_quota),
    current: toUsageCardSnapshot(state?.userPackgeUsage),
    week: state?.userPackgeUsage_week ? toUsageCardSnapshot(state.userPackgeUsage_week) : null,
    email: state?.user?.email ?? null,
    packageTotalUsd: toNumber(state?.package?.total_quota),
    packageExpiresAt: pickNearestExpiresAt(state?.package?.packages)
  }
}
