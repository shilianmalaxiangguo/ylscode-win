export type NumberLike = number | string | null | undefined

export interface UsagePayload {
  remaining_quota?: NumberLike
  used_percentage?: NumberLike
  total_quota?: NumberLike
}

export interface PackageItem {
  package_status?: string | null
  package_type?: string | null
  is_active?: boolean | NumberLike
  expires_at?: string | null
  expire_at?: string | null
  end_at?: string | null
}

export interface PackagePayload {
  total_quota?: NumberLike
  packages?: PackageItem[] | null
}

export interface APIEnvelope {
  state?: {
    remaining_quota?: NumberLike
    user?: {
      email?: string | null
    } | null
    userPackgeUsage?: UsagePayload | null
    userPackgeUsage_week?: UsagePayload | null
    package?: PackagePayload | null
  } | null
}

export interface UsageCardSnapshot {
  remainingUsd: number
  usedUsd: number
  totalUsd: number
  ratio: number
}

export interface DashboardSnapshot {
  remainingUsd: number | null
  current: UsageCardSnapshot | null
  week: UsageCardSnapshot | null
  email: string | null
  packageType: string | null
  packageDaysRemaining: number | null
  packageTotalUsd: number | null
  packageExpiresAt: string | null
}
