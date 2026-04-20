import { afterEach, describe, expect, it, vi } from 'vitest'
import { createQuotaService } from '../quota-service.js'

describe('quota service', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends bearer token in Authorization header', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ state: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    )
    const service = createQuotaService({ fetchImpl })

    await service.fetchQuotaSnapshot('secret-token')

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://codex.ylsagi.com/codex/info',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token'
        })
      })
    )
  })

  it('maps successful API envelope with Date.now() as reference time', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-04-20T00:00:00.000Z'))
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          state: {
            remaining_quota: '123',
            package: {
              packages: [
                { package_status: 'expired', expires_at: '2026-04-19T00:00:00.000Z' },
                { package_status: 'expired', expires_at: '2026-04-21T00:00:00.000Z' }
              ]
            }
          }
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      )
    )
    const service = createQuotaService({ fetchImpl })

    const snapshot = await service.fetchQuotaSnapshot('token')

    expect(snapshot).toMatchObject({
      remainingUsd: 123,
      packageExpiresAt: '2026-04-21T00:00:00.000Z'
    })
  })
})
