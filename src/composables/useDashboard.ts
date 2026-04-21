import { onScopeDispose, ref } from 'vue'
import type { DashboardSnapshot } from '../../shared/types.js'

const EMPTY_TOKEN_MESSAGE = '请先配置 Token'
const PREVIEW_TOKEN = 'preview-token'
const createPreviewSnapshot = (): DashboardSnapshot => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  return {
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
    email: 'preview@example.com',
    packageType: 'max',
    packageDaysRemaining: 7,
    packageTotalUsd: 500000,
    packageExpiresAt: expiresAt
  }
}

const intervalOptions = [5000, 30000, 60000, 180000, 300000, 600000] as const

type DesktopBridge = Window['ylsDesktop']

const previewState = {
  token: PREVIEW_TOKEN,
  pollingMs: 60000,
  alwaysOnTop: false
}

const previewBridge: DesktopBridge = {
  getSettings: async () => ({ ...previewState }),
  saveToken: async (token: string) => {
    previewState.token = token.trim()
    return { ...previewState }
  },
  setIntervalMs: async (pollingMs: number) => {
    previewState.pollingMs = pollingMs
    return { ...previewState }
  },
  setAlwaysOnTop: async (alwaysOnTop: boolean) => {
    previewState.alwaysOnTop = alwaysOnTop
    return { ...previewState }
  },
  fetchQuotaSnapshot: async () => {
    if (!previewState.token) {
      throw new Error(EMPTY_TOKEN_MESSAGE)
    }
    return createPreviewSnapshot()
  }
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  return '操作失败，请稍后重试'
}

const getDesktopBridge = (): DesktopBridge => {
  const bridge = globalThis.window?.ylsDesktop
  return bridge ?? previewBridge
}

export const useDashboard = () => {
  const snapshot = ref<DashboardSnapshot | null>(null)
  const token = ref('')
  const pollingMs = ref(60000)
  const alwaysOnTop = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let sessionId = 0
  let requestIdSeed = 0
  let latestRequestId = 0
  let pollingActive = false

  const clearPollingTimer = () => {
    if (!timer) {
      return
    }
    clearTimeout(timer)
    timer = null
  }

  const stopPolling = () => {
    pollingActive = false
    clearPollingTimer()
  }

  const invalidateInFlightRequests = () => {
    sessionId += 1
    latestRequestId = ++requestIdSeed
  }

  const refresh = async (): Promise<boolean> => {
    if (!token.value.trim()) {
      snapshot.value = null
      error.value = EMPTY_TOKEN_MESSAGE
      loading.value = false
      return false
    }

    const requestId = ++requestIdSeed
    const requestSessionId = sessionId
    latestRequestId = requestId
    loading.value = true
    try {
      const next = await getDesktopBridge().fetchQuotaSnapshot()
      if (requestSessionId !== sessionId || requestId !== latestRequestId) {
        return false
      }
      snapshot.value = next
      error.value = null
      return true
    } catch (err) {
      if (requestSessionId !== sessionId || requestId !== latestRequestId) {
        return false
      }
      error.value = toErrorMessage(err)
      return false
    } finally {
      if (requestSessionId === sessionId && requestId === latestRequestId) {
        loading.value = false
      }
    }
  }

  const scheduleNextPoll = (pollSessionId: number) => {
    if (!pollingActive || pollSessionId !== sessionId || !token.value.trim()) {
      return
    }

    clearPollingTimer()
    timer = setTimeout(async () => {
      timer = null
      if (!pollingActive || pollSessionId !== sessionId || !token.value.trim()) {
        return
      }
      await refresh()
      if (!pollingActive || pollSessionId !== sessionId || !token.value.trim()) {
        return
      }
      scheduleNextPoll(pollSessionId)
    }, pollingMs.value)
  }

  const startPolling = () => {
    stopPolling()
    if (!token.value.trim()) {
      return
    }
    pollingActive = true
    scheduleNextPoll(sessionId)
  }

  const syncFromSettings = (settings: {
    token: string
    pollingMs: number
    alwaysOnTop: boolean
  }) => {
    token.value = settings.token
    pollingMs.value = settings.pollingMs
    alwaysOnTop.value = settings.alwaysOnTop
  }

  const init = async () => {
    loading.value = true
    invalidateInFlightRequests()
    stopPolling()
    try {
      const settings = await getDesktopBridge().getSettings()
      syncFromSettings(settings)

      if (!token.value.trim()) {
        snapshot.value = null
        error.value = EMPTY_TOKEN_MESSAGE
        return
      }

      const activeSession = sessionId
      await refresh()
      if (activeSession !== sessionId || !token.value.trim()) {
        return
      }
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const saveToken = async (nextToken: string) => {
    const hadValidTokenBefore = token.value.trim().length > 0
    loading.value = true
    invalidateInFlightRequests()
    stopPolling()
    try {
      const settings = await getDesktopBridge().saveToken(nextToken)
      syncFromSettings(settings)

      if (!token.value.trim()) {
        snapshot.value = null
        error.value = EMPTY_TOKEN_MESSAGE
        return
      }

      const activeSession = sessionId
      await refresh()
      if (activeSession !== sessionId || !token.value.trim()) {
        return
      }
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
      if (hadValidTokenBefore && token.value.trim()) {
        startPolling()
      }
    } finally {
      loading.value = false
    }
  }

  const changeInterval = async (nextPollingMs: number) => {
    try {
      const settings = await getDesktopBridge().setIntervalMs(nextPollingMs)
      syncFromSettings(settings)
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
    }
  }

  const toggleAlwaysOnTop = async (value: boolean) => {
    try {
      const settings = await getDesktopBridge().setAlwaysOnTop(value)
      syncFromSettings(settings)
    } catch (err) {
      error.value = toErrorMessage(err)
    }
  }

  onScopeDispose(() => {
    stopPolling()
    invalidateInFlightRequests()
  })

  return {
    snapshot,
    token,
    pollingMs,
    alwaysOnTop,
    loading,
    error,
    intervalOptions,
    init,
    refresh,
    saveToken,
    changeInterval,
    toggleAlwaysOnTop
  }
}
