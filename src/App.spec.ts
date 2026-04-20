import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import type { DashboardSnapshot } from '../shared/types.js'

const snapshotFixture: DashboardSnapshot = {
  remainingUsd: 102.5,
  current: {
    remainingUsd: 102.5,
    usedUsd: 47.5,
    totalUsd: 150,
    ratio: 0.3167
  },
  week: {
    remainingUsd: 60,
    usedUsd: 40,
    totalUsd: 100,
    ratio: 0.4
  },
  email: 'tester@example.com',
  packageTotalUsd: 1000,
  packageExpiresAt: '2099-01-01T00:00:00.000Z'
}

const createBridgeMock = () => ({
  getSettings: vi.fn().mockResolvedValue({
    token: 'existing-token',
    pollingMs: 60000,
    alwaysOnTop: false
  }),
  saveToken: vi.fn().mockImplementation(async (token: string) => ({
    token,
    pollingMs: 60000,
    alwaysOnTop: false
  })),
  setIntervalMs: vi.fn().mockImplementation(async (pollingMs: number) => ({
    token: 'existing-token',
    pollingMs,
    alwaysOnTop: false
  })),
  setAlwaysOnTop: vi.fn().mockImplementation(async (alwaysOnTop: boolean) => ({
    token: 'existing-token',
    pollingMs: 60000,
    alwaysOnTop
  })),
  fetchQuotaSnapshot: vi.fn().mockResolvedValue(snapshotFixture)
})

const flushAsync = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('App widget UI', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { ylsDesktop: createBridgeMock() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders quota, account info and action buttons after init', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [ui]
      }
    })

    await flushAsync()
    await flushAsync()

    const text = wrapper.text()
    expect(text).toContain('YLS Code')
    expect(text).toContain('剩余额度 (USD)')
    expect(text).toContain('$102.50')
    expect(text).toContain('当前额度 (USD)')
    expect(text).toContain('$47.50 / $150')
    expect(text).toContain('本周额度 (USD)')
    expect(text).toContain('$40 / $100')
    expect(text).toContain('tester@example.com')
    expect(text).toContain('$1,000')
    expect(text).toContain('置顶')
    expect(text).toContain('刷新')
    expect(text).toContain('5s')
    expect(text).toContain('30s')
    expect(text).toContain('60s')
    expect(text).toContain('3min')
    expect(text).toContain('5min')
    expect(text).toContain('10min')
  })
})
