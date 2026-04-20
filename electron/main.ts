import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers } from './ipc.js'
import { createQuotaService } from './quota-service.js'
import { createSettingsStore, type WidgetSettings } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

const createWindow = async (settings: WidgetSettings) => {
  const win = new BrowserWindow({
    width: 420,
    height: 520,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow = win
  win.on('closed', () => {
    mainWindow = null
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    await win.loadURL(devServerUrl)
    return
  }

  await win.loadFile(path.join(__dirname, '../../dist/index.html'))
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData')
  const settingsStore = createSettingsStore(path.join(userDataPath, 'settings.json'))
  const quotaService = createQuotaService()

  registerIpcHandlers({
    ipcMain,
    settingsStore,
    quotaService,
    getMainWindow: () => mainWindow
  })

  settingsStore
    .getSettings()
    .then(settings => createWindow(settings))
    .catch((error) => {
      console.error('failed to create browser window', error)
      app.quit()
    })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      settingsStore
        .getSettings()
        .then(settings => createWindow(settings))
        .catch((error) => {
          console.error('failed to reactivate browser window', error)
        })
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
