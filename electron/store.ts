import fs from 'node:fs/promises'
import path from 'node:path'

export interface WidgetSettings {
  token: string
  pollingMs: number
  alwaysOnTop: boolean
}

export const DEFAULT_SETTINGS: WidgetSettings = {
  token: '',
  pollingMs: 60000,
  alwaysOnTop: false
}

const normalizeSettings = (value: Partial<WidgetSettings> | null | undefined): WidgetSettings => ({
  token: typeof value?.token === 'string' ? value.token : DEFAULT_SETTINGS.token,
  pollingMs: typeof value?.pollingMs === 'number' ? value.pollingMs : DEFAULT_SETTINGS.pollingMs,
  alwaysOnTop:
    typeof value?.alwaysOnTop === 'boolean' ? value.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop
})

export interface SettingsStore {
  getSettings: () => Promise<WidgetSettings>
  saveToken: (token: string) => Promise<WidgetSettings>
  setIntervalMs: (pollingMs: number) => Promise<WidgetSettings>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<WidgetSettings>
}

export const createSettingsStore = (settingsPath: string): SettingsStore => {
  const readSettings = async (): Promise<WidgetSettings> => {
    try {
      const raw = await fs.readFile(settingsPath, 'utf8')
      const parsed = JSON.parse(raw) as Partial<WidgetSettings>
      return normalizeSettings(parsed)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return DEFAULT_SETTINGS
      }
      throw error
    }
  }

  const writeSettings = async (next: WidgetSettings): Promise<WidgetSettings> => {
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    await fs.writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    return next
  }

  const patchSettings = async (patch: Partial<WidgetSettings>): Promise<WidgetSettings> => {
    const current = await readSettings()
    return writeSettings({
      ...current,
      ...patch
    })
  }

  return {
    getSettings: readSettings,
    saveToken: token => patchSettings({ token }),
    setIntervalMs: pollingMs => patchSettings({ pollingMs }),
    setAlwaysOnTop: alwaysOnTop => patchSettings({ alwaysOnTop })
  }
}
