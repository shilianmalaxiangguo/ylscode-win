import type {
  APIEnvelope,
  DashboardSnapshot,
  NumberLike,
  PackageItem,
  TodayUsageSnapshot,
  UsageCardSnapshot,
  UsagePayload
} from './types.js'

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

  const usedUsd = Math.max(0, totalUsd - remainingUsd)
  const usedPercentage = toNumber(usage?.used_percentage)
  const ratio = usedPercentage != null ? clamp01(usedPercentage / 100) : clamp01(usedUsd / totalUsd)

  return {
    remainingUsd,
    usedUsd,
    totalUsd,
    ratio
  }
}

const toTodayUsageSnapshot = (usage: UsagePayload | null | undefined): TodayUsageSnapshot | null => {
  if (!usage) {
    return null
  }

  return {
    totalTokens: toNumber(usage.total_tokens),
    requestCount: toNumber(usage.request_count),
    inputTokens: toNumber(usage.input_tokens),
    cachedInputTokens: toNumber(usage.input_tokens_cached)
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

const toReferenceTimeMs = (value: number): number => {
  const parsed = toNumber(value)
  if (parsed == null) {
    throw new Error('referenceTimeMs must be a finite number')
  }
  return parsed
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

const pickDisplayPackage = (
  packages: PackageItem[] | null | undefined,
  referenceTimeMs: number
): { item: PackageItem | null; expiresAt: string | null; timestamp: number | null } => {
  if (!packages?.length) {
    return { item: null, expiresAt: null, timestamp: null }
  }

  const reference = referenceTimeMs
  const parseable = packages
    .map(item => {
      const expiresAt = getExpiresAt(item)
      return {
        item,
        expiresAt,
        timestamp: parseTimestamp(expiresAt),
        active: isActivePackage(item)
      }
    })
    .filter(item => item.timestamp != null) as Array<{ item: PackageItem; expiresAt: string; timestamp: number; active: boolean }>

  const activeCurrent = parseable
    .filter(item => item.active && item.timestamp >= reference)
    .sort((left, right) => left.timestamp - right.timestamp)

  if (activeCurrent.length > 0) {
    const selected = activeCurrent[0]
    return { item: selected.item, expiresAt: selected.expiresAt, timestamp: selected.timestamp }
  }

  const nearest = parseable.sort((left, right) => {
    const leftDiff = Math.abs(left.timestamp - reference)
    const rightDiff = Math.abs(right.timestamp - reference)
    if (leftDiff !== rightDiff) {
      return leftDiff - rightDiff
    }

    const leftIsFuture = left.timestamp >= reference
    const rightIsFuture = right.timestamp >= reference
    if (leftIsFuture !== rightIsFuture) {
      return leftIsFuture ? -1 : 1
    }

    return left.timestamp - right.timestamp
  })
  const selected = nearest[0]
  return {
    item: selected?.item ?? null,
    expiresAt: selected?.expiresAt ?? null,
    timestamp: selected?.timestamp ?? null
  }
}

const resolvePackageDaysRemaining = (timestamp: number | null, referenceTimeMs: number): number | null => {
  if (timestamp == null) {
    return null
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const referenceDate = new Date(referenceTimeMs)
  const targetDate = new Date(timestamp)
  const referenceStart = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  )
  const targetStart = Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  )

  return Math.max(0, Math.floor((targetStart - referenceStart) / millisecondsPerDay))
}

export const mapApiEnvelopeToDashboardSnapshot = (
  envelope: APIEnvelope,
  referenceTimeMs: number
): DashboardSnapshot => {
  const state = envelope.state
  const reference = toReferenceTimeMs(referenceTimeMs)
  const selectedPackage = pickDisplayPackage(state?.package?.packages, reference)

  return {
    remainingUsd:
      toNumber(state?.remaining_quota) ??
      toNumber(state?.userPackgeUsage?.remaining_quota) ??
      toNumber(state?.userPackgeUsage_week?.remaining_quota),
    current: toUsageCardSnapshot(state?.userPackgeUsage),
    week: state?.userPackgeUsage_week ? toUsageCardSnapshot(state.userPackgeUsage_week) : null,
    todayUsage: toTodayUsageSnapshot(state?.userPackgeUsage),
    email: state?.user?.email ?? null,
    packageType: selectedPackage.item?.package_type ?? null,
    packageDaysRemaining: resolvePackageDaysRemaining(selectedPackage.timestamp, reference),
    packageTotalUsd: toNumber(state?.package?.total_quota),
    packageExpiresAt: selectedPackage.expiresAt
  }
}
