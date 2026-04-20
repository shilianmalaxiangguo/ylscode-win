import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers } from './ipc.js'
import { createQuotaService } from './quota-service.js'
import { createSettingsStore, type WidgetSettings } from './store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APP_TITLE = '伊莉思用量查询'

let mainWindow: BrowserWindow | null = null

const getWindowIconPath = () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.ico')
  }

  return path.join(process.cwd(), 'build', 'icon.ico')
}

const createWindow = async (settings: WidgetSettings) => {
  const win = new BrowserWindow({
    title: APP_TITLE,
    width: 420,
    height: 520,
    alwaysOnTop: settings.alwaysOnTop,
    autoHideMenuBar: true,
    icon: getWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setMenuBarVisibility(false)
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
  app.setName(APP_TITLE)
  Menu.setApplicationMenu(null)
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
