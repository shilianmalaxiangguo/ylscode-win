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

export const registerIpcHandlers = ({
  ipcMain,
  settingsStore,
  quotaService,
  getMainWindow
}: RegisterIpcHandlersOptions): void => {
  ipcMain.handle(IPC_CHANNELS.settingsGet, async () => settingsStore.getSettings())

  ipcMain.handle(IPC_CHANNELS.settingsSaveToken, async (_event, token: string) => {
    return settingsStore.saveToken(token)
  })

  ipcMain.handle(IPC_CHANNELS.settingsSetInterval, async (_event, pollingMs: number) => {
    return settingsStore.setIntervalMs(pollingMs)
  })

  ipcMain.handle(IPC_CHANNELS.settingsSetAlwaysOnTop, async (_event, alwaysOnTop: boolean) => {
    const settings = await settingsStore.setAlwaysOnTop(alwaysOnTop)
    getMainWindow()?.setAlwaysOnTop(alwaysOnTop)
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
