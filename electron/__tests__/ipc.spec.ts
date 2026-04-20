import { describe, expect, it, vi } from 'vitest'
import { IPC_CHANNELS, registerIpcHandlers } from '../ipc.js'
import type { DashboardSnapshot } from '../../shared/types.js'
import type { SettingsStore, WidgetSettings } from '../store.js'
import type { QuotaService } from '../quota-service.js'

type Handler = (...args: unknown[]) => unknown

const createSettings = (patch: Partial<WidgetSettings> = {}): WidgetSettings => ({
  token: '',
  pollingMs: 60000,
  alwaysOnTop: false,
  ...patch
})

describe('registerIpcHandlers', () => {
  it('throws when quota fetch is requested without token', async () => {
    const handlers = new Map<string, Handler>()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: Handler) => {
        handlers.set(channel, handler)
      })
    }
    const settingsStore: SettingsStore = {
      getSettings: vi.fn(async () => createSettings({ token: '   ' })),
      saveToken: vi.fn(),
      setIntervalMs: vi.fn(),
      setAlwaysOnTop: vi.fn()
    }
    const quotaService: QuotaService = {
      fetchQuotaSnapshot: vi.fn(async () => {
        throw new Error('should not be called')
      })
    }

    registerIpcHandlers({
      ipcMain: ipcMain as never,
      settingsStore,
      quotaService,
      getMainWindow: () => null
    })

    const quotaFetch = handlers.get(IPC_CHANNELS.quotaFetch)
    await expect(quotaFetch?.()).rejects.toThrow('token is required')
    expect(quotaService.fetchQuotaSnapshot).not.toHaveBeenCalled()
  })

  it('calls BrowserWindow.setAlwaysOnTop when settings:set-always-on-top is invoked', async () => {
    const handlers = new Map<string, Handler>()
    const setAlwaysOnTopWindow = vi.fn()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: Handler) => {
        handlers.set(channel, handler)
      })
    }
    const settingsStore: SettingsStore = {
      getSettings: vi.fn(async () => createSettings()),
      saveToken: vi.fn(async () => createSettings()),
      setIntervalMs: vi.fn(async () => createSettings()),
      setAlwaysOnTop: vi.fn(async () => createSettings({ alwaysOnTop: true }))
    }
    const quotaService: QuotaService = {
      fetchQuotaSnapshot: vi.fn(async () => ({ remainingUsd: 1 } as DashboardSnapshot))
    }

    registerIpcHandlers({
      ipcMain: ipcMain as never,
      settingsStore,
      quotaService,
      getMainWindow: () =>
        ({
          setAlwaysOnTop: setAlwaysOnTopWindow
        }) as never
    })

    const setAlways = handlers.get(IPC_CHANNELS.settingsSetAlwaysOnTop)
    await setAlways?.({}, true)

    expect(settingsStore.setAlwaysOnTop).toHaveBeenCalledWith(true)
    expect(setAlwaysOnTopWindow).toHaveBeenCalledWith(true)
  })

  it('rejects invalid pollingMs input', async () => {
    const handlers = new Map<string, Handler>()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: Handler) => {
        handlers.set(channel, handler)
      })
    }
    const settingsStore: SettingsStore = {
      getSettings: vi.fn(async () => createSettings({ token: 'x' })),
      saveToken: vi.fn(async () => createSettings()),
      setIntervalMs: vi.fn(async () => createSettings()),
      setAlwaysOnTop: vi.fn(async () => createSettings())
    }
    const quotaService: QuotaService = {
      fetchQuotaSnapshot: vi.fn(async () => ({ remainingUsd: 1 } as DashboardSnapshot))
    }

    registerIpcHandlers({
      ipcMain: ipcMain as never,
      settingsStore,
      quotaService,
      getMainWindow: () => null
    })

    const setInterval = handlers.get(IPC_CHANNELS.settingsSetInterval)
    await expect(setInterval?.({}, 0)).rejects.toThrow()
    expect(settingsStore.setIntervalMs).not.toHaveBeenCalled()
  })

  it('rejects non-string token input', async () => {
    const handlers = new Map<string, Handler>()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: Handler) => {
        handlers.set(channel, handler)
      })
    }
    const settingsStore: SettingsStore = {
      getSettings: vi.fn(async () => createSettings({ token: 'x' })),
      saveToken: vi.fn(async () => createSettings()),
      setIntervalMs: vi.fn(async () => createSettings()),
      setAlwaysOnTop: vi.fn(async () => createSettings())
    }
    const quotaService: QuotaService = {
      fetchQuotaSnapshot: vi.fn(async () => ({ remainingUsd: 1 } as DashboardSnapshot))
    }

    registerIpcHandlers({
      ipcMain: ipcMain as never,
      settingsStore,
      quotaService,
      getMainWindow: () => null
    })

    const saveToken = handlers.get(IPC_CHANNELS.settingsSaveToken)
    await expect(saveToken?.({}, 123)).rejects.toThrow()
    expect(settingsStore.saveToken).not.toHaveBeenCalled()
  })

  it('rejects invalid alwaysOnTop input', async () => {
    const handlers = new Map<string, Handler>()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: Handler) => {
        handlers.set(channel, handler)
      })
    }
    const settingsStore: SettingsStore = {
      getSettings: vi.fn(async () => createSettings({ token: 'x' })),
      saveToken: vi.fn(async () => createSettings()),
      setIntervalMs: vi.fn(async () => createSettings()),
      setAlwaysOnTop: vi.fn(async () => createSettings())
    }
    const quotaService: QuotaService = {
      fetchQuotaSnapshot: vi.fn(async () => ({ remainingUsd: 1 } as DashboardSnapshot))
    }

    registerIpcHandlers({
      ipcMain: ipcMain as never,
      settingsStore,
      quotaService,
      getMainWindow: () => null
    })

    const setAlways = handlers.get(IPC_CHANNELS.settingsSetAlwaysOnTop)
    await expect(setAlways?.({}, 'yes')).rejects.toThrow()
    expect(settingsStore.setAlwaysOnTop).not.toHaveBeenCalled()
  })
})
