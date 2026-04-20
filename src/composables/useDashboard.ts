import { onScopeDispose, ref } from 'vue'
import type { DashboardSnapshot } from '../../shared/types.js'

const EMPTY_TOKEN_MESSAGE = '请先配置 Token'

const intervalOptions = [5000, 30000, 60000, 180000, 300000, 600000] as const

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.trim()) {
    return error
  }
  return '操作失败，请稍后重试'
}

export const useDashboard = () => {
  const snapshot = ref<DashboardSnapshot | null>(null)
  const token = ref('')
  const pollingMs = ref(60000)
  const alwaysOnTop = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let timer: ReturnType<typeof setInterval> | null = null

  const stopPolling = () => {
    if (!timer) {
      return
    }
    clearInterval(timer)
    timer = null
  }

  const refresh = async () => {
    if (!token.value.trim()) {
      snapshot.value = null
      error.value = EMPTY_TOKEN_MESSAGE
      return
    }

    loading.value = true
    try {
      const next = await window.ylsDesktop.fetchQuotaSnapshot()
      snapshot.value = next
      error.value = null
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const startPolling = () => {
    stopPolling()
    if (!token.value.trim()) {
      return
    }
    timer = setInterval(() => {
      void refresh()
    }, pollingMs.value)
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
    try {
      const settings = await window.ylsDesktop.getSettings()
      syncFromSettings(settings)

      if (!token.value.trim()) {
        stopPolling()
        snapshot.value = null
        error.value = EMPTY_TOKEN_MESSAGE
        return
      }

      await refresh()
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const saveToken = async (nextToken: string) => {
    loading.value = true
    try {
      const settings = await window.ylsDesktop.saveToken(nextToken)
      syncFromSettings(settings)

      if (!token.value.trim()) {
        stopPolling()
        snapshot.value = null
        error.value = EMPTY_TOKEN_MESSAGE
        return
      }

      await refresh()
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const changeInterval = async (nextPollingMs: number) => {
    try {
      const settings = await window.ylsDesktop.setIntervalMs(nextPollingMs)
      syncFromSettings(settings)
      startPolling()
    } catch (err) {
      error.value = toErrorMessage(err)
    }
  }

  const toggleAlwaysOnTop = async (value: boolean) => {
    try {
      const settings = await window.ylsDesktop.setAlwaysOnTop(value)
      syncFromSettings(settings)
    } catch (err) {
      error.value = toErrorMessage(err)
    }
  }

  onScopeDispose(() => {
    stopPolling()
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
