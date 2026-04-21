import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import type { DashboardSnapshot } from '../shared/types.js'

const snapshotFixture = {
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
  packageType: 'max',
  packageDaysRemaining: 7,
  packageTotalUsd: 1000,
  packageExpiresAt: '2099-01-01T00:00:00.000Z',
  todayUsage: {
    requestCount: 128,
    inputTokens: 3214567,
    cachedInputTokens: 2987654,
    outputTokens: 54321
  }
} as DashboardSnapshot

type BridgeMock = {
  getSettings: ReturnType<typeof vi.fn>
  saveToken: ReturnType<typeof vi.fn>
  setIntervalMs: ReturnType<typeof vi.fn>
  setAlwaysOnTop: ReturnType<typeof vi.fn>
  fetchQuotaSnapshot: ReturnType<typeof vi.fn>
}

const createBridgeMock = (overrides: Partial<BridgeMock> = {}): BridgeMock => ({
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
  fetchQuotaSnapshot: vi.fn().mockResolvedValue(snapshotFixture),
  ...overrides
})

const flushAsync = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const mountApp = async (bridge: BridgeMock) => {
  vi.stubGlobal('window', { ylsDesktop: bridge })
  const wrapper = mount(App, {
    global: {
      plugins: [ui]
    }
  })
  await flushAsync()
  await flushAsync()
  return wrapper
}

describe('App widget UI', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2098-12-25T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders quota, account info and action buttons after init', async () => {
    const wrapper = await mountApp(createBridgeMock())

    const text = wrapper.text()
    expect(text).toContain('伊莉思Code')
    expect(text).toContain('当前额度 (USD)')
    expect(text).toContain('$47.50/ $150')
    expect(text).toContain('本周额度 (USD)')
    expect(text).toContain('$40/ $100')
    expect(text).toContain('Max')
    expect(text).toContain('tester@example.com')
    expect(text).toContain('剩余 7 天')
    expect(text).not.toContain('$150/天')
    expect(text).toContain('置顶')
    expect(text).toContain('刷新')
    expect(text).not.toContain('剩余额度 (USD)')
    expect(text).toContain('5s')
    expect(text).toContain('30s')
    expect(text).toContain('60s')
    expect(text).toContain('3min')
    expect(text).toContain('5min')
    expect(text).toContain('10min')
  })

  it('shows empty token hint when token is missing', async () => {
    const bridge = createBridgeMock({
      getSettings: vi.fn().mockResolvedValue({
        token: '',
        pollingMs: 60000,
        alwaysOnTop: false
      })
    })
    const wrapper = await mountApp(bridge)

    expect(wrapper.text()).toContain('请先配置 Token')
  })

  it('shows real error instead of empty token hint when init fails', async () => {
    const bridge = createBridgeMock({
      getSettings: vi.fn().mockRejectedValue(new Error('settings unavailable'))
    })
    const wrapper = await mountApp(bridge)

    const text = wrapper.text()
    expect(text).toContain('settings unavailable')
    expect(text).not.toContain('请先配置 Token')
  })

  it('shows week placeholders when week quota is missing', async () => {
    const bridge = createBridgeMock({
      fetchQuotaSnapshot: vi.fn().mockResolvedValue({
        ...snapshotFixture,
        week: null
      })
    })
    const wrapper = await mountApp(bridge)

    const text = wrapper.text()
    expect(text).toContain('本周额度 (USD)')
    expect(text).toContain('$--/ $--')
    expect(text).toContain('已用额度')
  })

  it('keeps settings controls available during refresh and triggers save/interval actions', async () => {
    let resolveRefresh: (value: DashboardSnapshot) => void = () => {}
    const pendingRefresh = new Promise<DashboardSnapshot>((resolve) => {
      resolveRefresh = resolve
    })

    const bridge = createBridgeMock({
      fetchQuotaSnapshot: vi
        .fn()
        .mockResolvedValueOnce(snapshotFixture)
        .mockReturnValueOnce(pendingRefresh)
        .mockResolvedValue(snapshotFixture)
    })

    const wrapper = await mountApp(bridge)
    const tokenInput = wrapper.get('#token-input')
    const intervalSelect = wrapper.get('#polling-select')
    const refreshButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('刷新'))
    expect(refreshButton).toBeTruthy()

    refreshButton!.element.click()
    await flushAsync()

    expect((tokenInput.element as HTMLInputElement).disabled).toBe(false)
    expect((intervalSelect.element as HTMLSelectElement).disabled).toBe(false)
    const settingsButtons = Array.from(
      tokenInput.element.closest('section')?.querySelectorAll('button') ?? []
    ) as HTMLButtonElement[]
    expect(settingsButtons.length).toBeGreaterThanOrEqual(2)
    expect(settingsButtons.every((button) => button.disabled === false)).toBe(true)

    const toggleButton = settingsButtons[0]
    expect((tokenInput.element as HTMLInputElement).type).toBe('password')
    await toggleButton.click()
    await flushAsync()
    expect((tokenInput.element as HTMLInputElement).type).toBe('text')

    ;(tokenInput.element as HTMLInputElement).value = 'updated-token'
    tokenInput.element.dispatchEvent(new Event('input'))
    await flushAsync()
    const saveButton = settingsButtons[1]
    await saveButton.click()
    await flushAsync()
    expect(bridge.saveToken).toHaveBeenCalledWith('updated-token')

    ;(intervalSelect.element as HTMLSelectElement).value = '300000'
    intervalSelect.element.dispatchEvent(new Event('change'))
    await flushAsync()
    expect(bridge.setIntervalMs).toHaveBeenCalledWith(300000)

    resolveRefresh(snapshotFixture)
    await flushAsync()
  })

  it('renders preview data when electron bridge is unavailable in plain web mode', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [ui]
      }
    })

    await flushAsync()
    await flushAsync()

    const text = wrapper.text()
    expect(text).toContain('伊莉思Code')
    expect(text).toContain('当前额度 (USD)')
    expect(text).toContain('$120/ $500')
    expect(text).toContain('Max')
    expect(text).toContain('preview@example.com')
    expect(text).not.toContain('$500/天')
    expect(text).not.toContain("Cannot read properties of undefined")
  })

  it('infers Max plan when package_type is missing but daily quota is 200 or more', async () => {
    const bridge = createBridgeMock({
      fetchQuotaSnapshot: vi.fn().mockResolvedValue({
        ...snapshotFixture,
        packageType: null,
        current: {
          ...snapshotFixture.current!,
          totalUsd: 240
        }
      })
    })
    const wrapper = await mountApp(bridge)

    expect(wrapper.text()).toContain('Max')
  })

  it('renders the today usage card with compact token values', async () => {
    const wrapper = await mountApp(createBridgeMock())

    const card = wrapper.get('.today-usage-card')
    const text = card.text()
    expect(text).toContain('128')
    expect(text).toContain('3.2M')
    expect(text).toContain('3M')
    expect(text).toContain('54.3K')
  })
})
