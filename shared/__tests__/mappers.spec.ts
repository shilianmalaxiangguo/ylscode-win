import { describe, expect, it } from 'vitest'
import { mapApiEnvelopeToDashboardSnapshot } from '../mappers'
import type { APIEnvelope } from '../types'

describe('mapApiEnvelopeToDashboardSnapshot', () => {
  it('maps full payload and parses string numbers', () => {
    const envelope: APIEnvelope = {
      state: {
        remaining_quota: '245000',
        user: { email: 'user@example.com' },
        userPackgeUsage: {
          remaining_quota: '380',
          total_quota: '500',
          used_percentage: '24'
        },
        userPackgeUsage_week: {
          remaining_quota: '740',
          total_quota: '1000'
        },
        package: {
          total_quota: '3000',
          packages: [
            { package_status: 'inactive', expires_at: '2026-04-01T00:00:00.000Z' },
            { package_status: 'active', expires_at: '2026-05-01T00:00:00.000Z' },
            { package_status: 'active', expires_at: '2026-04-30T00:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope)).toEqual({
      remainingUsd: 245000,
      current: {
        remainingUsd: 380,
        usedUsd: 120,
        totalUsd: 500,
        ratio: 0.24
      },
      week: {
        remainingUsd: 740,
        usedUsd: 260,
        totalUsd: 1000,
        ratio: 0.26
      },
      email: 'user@example.com',
      packageTotalUsd: 3000,
      packageExpiresAt: '2026-04-30T00:00:00.000Z'
    })
  })

  it('returns null for week when weekly payload is missing', () => {
    const envelope: APIEnvelope = {
      state: {
        userPackgeUsage: {
          remaining_quota: 80,
          total_quota: 100
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope).week).toBeNull()
  })

  it('falls back remainingUsd and package expiration selection when no active package', () => {
    const envelope: APIEnvelope = {
      state: {
        userPackgeUsage: {
          remaining_quota: '50',
          total_quota: '100'
        },
        package: {
          packages: [
            { package_status: 'expired', expires_at: 'not-a-date' },
            { package_status: 'expired', expires_at: '2026-10-01T00:00:00.000Z' },
            { package_status: 'expired', expires_at: '2026-08-01T00:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope)).toMatchObject({
      remainingUsd: 50,
      packageExpiresAt: '2026-08-01T00:00:00.000Z'
    })
  })

  it('does not throw and returns null-heavy snapshot on missing fields', () => {
    expect(mapApiEnvelopeToDashboardSnapshot({})).toEqual({
      remainingUsd: null,
      current: null,
      week: null,
      email: null,
      packageTotalUsd: null,
      packageExpiresAt: null
    })
  })
})
