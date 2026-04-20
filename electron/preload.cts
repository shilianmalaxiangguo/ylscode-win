const { contextBridge, ipcRenderer } = require('electron')

const IPC_CHANNELS = {
  settingsGet: 'settings:get',
  settingsSaveToken: 'settings:save-token',
  settingsSetInterval: 'settings:set-interval',
  settingsSetAlwaysOnTop: 'settings:set-always-on-top',
  quotaFetch: 'quota:fetch'
} as const

contextBridge.exposeInMainWorld('ylsDesktop', {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
  saveToken: (token: string) => ipcRenderer.invoke(IPC_CHANNELS.settingsSaveToken, token),
  setIntervalMs: (pollingMs: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsSetInterval, pollingMs),
  setAlwaysOnTop: (alwaysOnTop: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsSetAlwaysOnTop, alwaysOnTop),
  fetchQuotaSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.quotaFetch)
})
