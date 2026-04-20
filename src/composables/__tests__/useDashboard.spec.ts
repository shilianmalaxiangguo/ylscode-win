import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import type { DashboardSnapshot } from '../../../shared/types.js'
import { useDashboard } from '../useDashboard'

const snapshotFixture: DashboardSnapshot = {
  remainingUsd: 12.5,
  current: {
    remainingUsd: 12.5,
    usedUsd: 7.5,
    totalUsd: 20,
    ratio: 0.375
  },
  week: null,
  email: 'user@example.com',
  packageTotalUsd: 100,
  packageExpiresAt: '2099-01-01T00:00:00.000Z'
}

const createBridgeMock = () => ({
  getSettings: vi.fn().mockResolvedValue({
    token: '',
    pollingMs: 60000,
    alwaysOnTop: false
  }),
  saveToken: vi.fn().mockResolvedValue({
    token: '',
    pollingMs: 60000,
    alwaysOnTop: false
  }),
  setIntervalMs: vi.fn().mockImplementation(async (pollingMs: number) => ({
    token: 'saved-token',
    pollingMs,
    alwaysOnTop: false
  })),
  setAlwaysOnTop: vi.fn().mockImplementation(async (alwaysOnTop: boolean) => ({
    token: 'saved-token',
    pollingMs: 60000,
    alwaysOnTop
  })),
  fetchQuotaSnapshot: vi.fn().mockResolvedValue(snapshotFixture)
})

describe('useDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('init reads settings and refreshes immediately when token exists', async () => {
    const bridge = createBridgeMock()
    bridge.getSettings.mockResolvedValue({
      token: 'token-1',
      pollingMs: 30000,
      alwaysOnTop: true
    })
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!

    await dashboard.init()

    expect(bridge.getSettings).toHaveBeenCalledTimes(1)
    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(1)
    expect(dashboard.pollingMs.value).toBe(30000)
    expect(dashboard.alwaysOnTop.value).toBe(true)
    scope.stop()
  })

  it('init does not fetch when token is missing', async () => {
    const bridge = createBridgeMock()
    bridge.getSettings.mockResolvedValue({
      token: '',
      pollingMs: 60000,
      alwaysOnTop: false
    })
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!
    await dashboard.init()

    expect(bridge.fetchQuotaSnapshot).not.toHaveBeenCalled()
    expect(dashboard.error.value).toContain('Token')
    scope.stop()
  })

  it('changeInterval persists interval and uses new interval for next polling refresh', async () => {
    const bridge = createBridgeMock()
    bridge.getSettings.mockResolvedValue({
      token: 'token-2',
      pollingMs: 60000,
      alwaysOnTop: false
    })
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!
    await dashboard.init()

    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(1)
    await dashboard.changeInterval(5000)
    expect(bridge.setIntervalMs).toHaveBeenCalledWith(5000)

    await vi.advanceTimersByTimeAsync(4999)
    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('saveToken persists token, refreshes and starts polling; empty token stops polling', async () => {
    const bridge = createBridgeMock()
    bridge.getSettings.mockResolvedValue({
      token: '',
      pollingMs: 60000,
      alwaysOnTop: false
    })
    bridge.saveToken
      .mockResolvedValueOnce({
        token: 'new-token',
        pollingMs: 5000,
        alwaysOnTop: false
      })
      .mockResolvedValueOnce({
        token: '',
        pollingMs: 5000,
        alwaysOnTop: false
      })
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!

    await dashboard.init()
    await dashboard.saveToken('new-token')

    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5000)
    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(2)

    await dashboard.saveToken('')
    expect(dashboard.snapshot.value).toBeNull()
    expect(dashboard.error.value).toContain('Token')

    await vi.advanceTimersByTimeAsync(5000)
    expect(bridge.fetchQuotaSnapshot).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('toggleAlwaysOnTop updates persisted state and local state', async () => {
    const bridge = createBridgeMock()
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!
    await dashboard.toggleAlwaysOnTop(true)

    expect(bridge.setAlwaysOnTop).toHaveBeenCalledWith(true)
    expect(dashboard.alwaysOnTop.value).toBe(true)
    scope.stop()
  })

  it('refresh stores displayable error string when request fails', async () => {
    const bridge = createBridgeMock()
    bridge.fetchQuotaSnapshot.mockRejectedValue(new Error('network down'))
    bridge.getSettings.mockResolvedValue({
      token: 'token-3',
      pollingMs: 60000,
      alwaysOnTop: false
    })
    vi.stubGlobal('window', { ylsDesktop: bridge })

    const scope = effectScope()
    const dashboard = scope.run(() => useDashboard())!
    await dashboard.init()

    expect(dashboard.error.value).toContain('network down')
    scope.stop()
  })
})
