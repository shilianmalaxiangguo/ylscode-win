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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isValidPollingMs = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0

const assertToken = (token: unknown): string => {
  if (typeof token !== 'string') {
    throw new TypeError('token must be a string')
  }
  return token.trim()
}

const assertPollingMs = (pollingMs: unknown): number => {
  if (!isValidPollingMs(pollingMs)) {
    throw new TypeError('pollingMs must be a finite positive integer')
  }
  return pollingMs
}

const assertAlwaysOnTop = (alwaysOnTop: unknown): boolean => {
  if (typeof alwaysOnTop !== 'boolean') {
    throw new TypeError('alwaysOnTop must be a boolean')
  }
  return alwaysOnTop
}

const normalizeSettings = (
  value: unknown
): {
  settings: WidgetSettings
  dirty: boolean
} => {
  if (!isRecord(value)) {
    return { settings: DEFAULT_SETTINGS, dirty: true }
  }

  const token = typeof value.token === 'string' ? value.token.trim() : DEFAULT_SETTINGS.token
  const pollingMs = isValidPollingMs(value.pollingMs) ? value.pollingMs : DEFAULT_SETTINGS.pollingMs
  const alwaysOnTop =
    typeof value.alwaysOnTop === 'boolean' ? value.alwaysOnTop : DEFAULT_SETTINGS.alwaysOnTop

  return {
    settings: {
      token,
      pollingMs,
      alwaysOnTop
    },
    dirty:
      token !== value.token ||
      pollingMs !== value.pollingMs ||
      alwaysOnTop !== value.alwaysOnTop
  }
}

export interface SettingsStore {
  getSettings: () => Promise<WidgetSettings>
  saveToken: (token: string) => Promise<WidgetSettings>
  setIntervalMs: (pollingMs: number) => Promise<WidgetSettings>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<WidgetSettings>
}

export const createSettingsStore = (settingsPath: string): SettingsStore => {
  const writeSettings = async (next: WidgetSettings): Promise<WidgetSettings> => {
    await fs.mkdir(path.dirname(settingsPath), { recursive: true })
    await fs.writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    return next
  }

  const recoverSettings = async (): Promise<WidgetSettings> => {
    try {
      await writeSettings(DEFAULT_SETTINGS)
    } catch {
      // Best effort self-heal for broken settings file.
    }
    return DEFAULT_SETTINGS
  }

  const readSettings = async (): Promise<WidgetSettings> => {
    try {
      const raw = await fs.readFile(settingsPath, 'utf8')
      const parsed = JSON.parse(raw) as unknown
      const normalized = normalizeSettings(parsed)

      if (normalized.dirty) {
        await writeSettings(normalized.settings)
      }

      return normalized.settings
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') {
        return DEFAULT_SETTINGS
      }
      if (error instanceof SyntaxError) {
        return recoverSettings()
      }
      throw err
    }
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
    saveToken: async token => patchSettings({ token: assertToken(token) }),
    setIntervalMs: async pollingMs => patchSettings({ pollingMs: assertPollingMs(pollingMs) }),
    setAlwaysOnTop: async alwaysOnTop =>
      patchSettings({ alwaysOnTop: assertAlwaysOnTop(alwaysOnTop) })
  }
}
