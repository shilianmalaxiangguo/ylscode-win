import { describe, expect, it, vi } from 'vitest'
import { mapApiEnvelopeToDashboardSnapshot } from '../mappers'
import type { APIEnvelope } from '../types'

describe('mapApiEnvelopeToDashboardSnapshot', () => {
  const referenceTimeMs = Date.parse('2026-04-20T00:00:00.000Z')

  it('maps full payload and parses string numbers', () => {
    const envelope = {
      state: {
        remaining_quota: '245000',
        user: { email: 'user@example.com' },
        userPackgeUsage: {
          remaining_quota: '380',
          total_quota: '500',
          used_percentage: '24',
          request_count: 128,
          input_tokens: '3214567',
          input_tokens_cached: '2987654',
          output_tokens: '54321'
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

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs)).toEqual({
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
      todayUsage: {
        requestCount: 128,
        inputTokens: 3214567,
        cachedInputTokens: 2987654,
        outputTokens: 54321
      },
      email: 'user@example.com',
      packageType: null,
      packageDaysRemaining: 10,
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

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs).week).toBeNull()
  })

  it('falls back remainingUsd and picks package closest to reference time when no active package', () => {
    const customReferenceTimeMs = Date.parse('2031-01-01T00:00:00.000Z')

    const envelope: APIEnvelope = {
      state: {
        userPackgeUsage: {
          remaining_quota: '50',
          total_quota: '100'
        },
        package: {
          packages: [
            { package_status: 'expired', expires_at: 'not-a-date' },
            { package_status: 'expired', expires_at: '2020-01-01T00:00:00.000Z' },
            { package_status: 'expired', expires_at: '2030-12-28T00:00:00.000Z' },
            { package_status: 'expired', expires_at: '2032-02-01T00:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, customReferenceTimeMs)).toMatchObject({
      remainingUsd: 50,
      packageExpiresAt: '2030-12-28T00:00:00.000Z'
    })
  })

  it('falls back remainingUsd to weekly remaining_quota', () => {
    const envelope: APIEnvelope = {
      state: {
        userPackgeUsage: {
          total_quota: 100,
          remaining_quota: null
        },
        userPackgeUsage_week: {
          remaining_quota: '77',
          total_quota: '100'
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs).remainingUsd).toBe(77)
  })

  it('clamps usedUsd to non-negative when remaining exceeds total', () => {
    const envelope: APIEnvelope = {
      state: {
        userPackgeUsage: {
          remaining_quota: '120',
          total_quota: '100'
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs).current).toEqual({
      remainingUsd: 120,
      usedUsd: 0,
      totalUsd: 100,
      ratio: 0
    })
  })

  it('falls back when active package is expired and supports expire_at/end_at aliases', () => {
    const envelope: APIEnvelope = {
      state: {
        package: {
          packages: [
            { package_status: 'active', expires_at: '2026-04-10T00:00:00.000Z' },
            { is_active: 0, expire_at: '2026-04-21T00:00:00.000Z' },
            { is_active: 0, end_at: '2026-04-19T00:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs).packageExpiresAt).toBe('2026-04-21T00:00:00.000Z')
  })

  it('supports is_active alias as active package flag', () => {
    const envelope: APIEnvelope = {
      state: {
        package: {
          packages: [
            { is_active: 1, expire_at: '2026-05-01T00:00:00.000Z' },
            { package_status: 'active', end_at: '2026-05-03T00:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs).packageExpiresAt).toBe('2026-05-01T00:00:00.000Z')
  })

  it('does not read system time inside mapper', () => {
    const nowSpy = vi.spyOn(Date, 'now')
    const envelope: APIEnvelope = {
      state: {
        package: {
          packages: [{ expires_at: '2030-01-01T00:00:00.000Z' }]
        }
      }
    }

    mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs)
    expect(nowSpy).not.toHaveBeenCalled()
    nowSpy.mockRestore()
  })

  it('uses tie-break: prefer future when equally distant, then earlier time', () => {
    const tieReferenceTimeMs = Date.parse('2026-04-20T00:00:00.000Z')
    const envelope: APIEnvelope = {
      state: {
        package: {
          packages: [
            { package_status: 'expired', expires_at: '2026-04-19T00:00:00.000Z' },
            { package_status: 'expired', expires_at: '2026-04-21T00:00:00.000Z' },
            { package_status: 'expired', expires_at: '2026-04-21T12:00:00.000Z' }
          ]
        }
      }
    }

    expect(mapApiEnvelopeToDashboardSnapshot(envelope, tieReferenceTimeMs).packageExpiresAt).toBe('2026-04-21T00:00:00.000Z')
  })

  it('does not throw and returns null-heavy snapshot on missing fields', () => {
    expect(mapApiEnvelopeToDashboardSnapshot({}, referenceTimeMs)).toEqual({
      remainingUsd: null,
      current: null,
      week: null,
      todayUsage: null,
      email: null,
      packageType: null,
      packageDaysRemaining: null,
      packageTotalUsd: null,
      packageExpiresAt: null
    })
  })
})
