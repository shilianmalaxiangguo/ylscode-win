import { contextBridge, ipcRenderer } from 'electron'
import type { DesktopIpcBridge } from './ipc.js'
import { IPC_CHANNELS } from './ipc.js'

const bridge: DesktopIpcBridge = {
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
  saveToken: (token: string) => ipcRenderer.invoke(IPC_CHANNELS.settingsSaveToken, token),
  setIntervalMs: (pollingMs: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsSetInterval, pollingMs),
  setAlwaysOnTop: (alwaysOnTop: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.settingsSetAlwaysOnTop, alwaysOnTop),
  fetchQuotaSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.quotaFetch)
}

contextBridge.exposeInMainWorld('ylsDesktop', bridge)
