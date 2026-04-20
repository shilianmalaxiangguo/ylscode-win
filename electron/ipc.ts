import type { BrowserWindow, IpcMain } from 'electron'
import type { DashboardSnapshot } from '../shared/types.js'
import type { SettingsStore, WidgetSettings } from './store.js'
import type { QuotaService } from './quota-service.js'

export interface DesktopIpcBridge {
  getSettings: () => Promise<WidgetSettings>
  saveToken: (token: string) => Promise<WidgetSettings>
  setIntervalMs: (pollingMs: number) => Promise<WidgetSettings>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<WidgetSettings>
  fetchQuotaSnapshot: () => Promise<DashboardSnapshot>
}

export interface RegisterIpcHandlersOptions {
  ipcMain: IpcMain
  settingsStore: SettingsStore
  quotaService: QuotaService
  getMainWindow: () => BrowserWindow | null
}

export const IPC_CHANNELS = {
  settingsGet: 'settings:get',
  settingsSaveToken: 'settings:save-token',
  settingsSetInterval: 'settings:set-interval',
  settingsSetAlwaysOnTop: 'settings:set-always-on-top',
  quotaFetch: 'quota:fetch'
} as const

const isValidPollingMs = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0

const assertTokenInput = (token: unknown): string => {
  if (typeof token !== 'string') {
    throw new TypeError('token must be a string')
  }
  return token
}

const assertPollingMsInput = (pollingMs: unknown): number => {
  if (!isValidPollingMs(pollingMs)) {
    throw new TypeError('pollingMs must be a finite positive integer')
  }
  return pollingMs
}

const assertAlwaysOnTopInput = (alwaysOnTop: unknown): boolean => {
  if (typeof alwaysOnTop !== 'boolean') {
    throw new TypeError('alwaysOnTop must be a boolean')
  }
  return alwaysOnTop
}

export const registerIpcHandlers = ({
  ipcMain,
  settingsStore,
  quotaService,
  getMainWindow
}: RegisterIpcHandlersOptions): void => {
  ipcMain.handle(IPC_CHANNELS.settingsGet, async () => settingsStore.getSettings())

  ipcMain.handle(IPC_CHANNELS.settingsSaveToken, async (_event, token: unknown) => {
    return settingsStore.saveToken(assertTokenInput(token))
  })

  ipcMain.handle(IPC_CHANNELS.settingsSetInterval, async (_event, pollingMs: unknown) => {
    return settingsStore.setIntervalMs(assertPollingMsInput(pollingMs))
  })

  ipcMain.handle(IPC_CHANNELS.settingsSetAlwaysOnTop, async (_event, alwaysOnTop: unknown) => {
    const normalized = assertAlwaysOnTopInput(alwaysOnTop)
    const settings = await settingsStore.setAlwaysOnTop(normalized)
    getMainWindow()?.setAlwaysOnTop(normalized)
    return settings
  })

  ipcMain.handle(IPC_CHANNELS.quotaFetch, async () => {
    const settings = await settingsStore.getSettings()
    const token = settings.token.trim()

    if (!token) {
      throw new Error('token is required')
    }

    return quotaService.fetchQuotaSnapshot(token)
  })
}
