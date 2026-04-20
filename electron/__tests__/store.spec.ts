import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  createSettingsStore,
  type WidgetSettings
} from '../store.js'

const tmpRoots: string[] = []

const createTmpSettingsPath = async (): Promise<string> => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'yls-store-'))
  tmpRoots.push(root)
  return path.join(root, 'settings.json')
}

afterEach(async () => {
  await Promise.all(tmpRoots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })))
})

describe('settings store', () => {
  it('returns default settings when file does not exist', async () => {
    const settingsPath = await createTmpSettingsPath()
    const store = createSettingsStore(settingsPath)

    await expect(store.getSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('persists token, polling interval, and alwaysOnTop', async () => {
    const settingsPath = await createTmpSettingsPath()
    const store = createSettingsStore(settingsPath)

    await store.saveToken('  abc-token  ')
    await store.setIntervalMs(15000)
    await store.setAlwaysOnTop(true)

    const nextStore = createSettingsStore(settingsPath)
    const settings = await nextStore.getSettings()

    expect(settings).toEqual<WidgetSettings>({
      token: 'abc-token',
      pollingMs: 15000,
      alwaysOnTop: true
    })
  })

  it('self-heals corrupted settings file by returning defaults and rewriting file', async () => {
    const settingsPath = await createTmpSettingsPath()
    await fs.writeFile(settingsPath, '{invalid-json', 'utf8')
    const store = createSettingsStore(settingsPath)

    await expect(store.getSettings()).resolves.toEqual(DEFAULT_SETTINGS)

    const rewritten = await fs.readFile(settingsPath, 'utf8')
    expect(JSON.parse(rewritten)).toEqual(DEFAULT_SETTINGS)
  })

  it('rejects invalid pollingMs and does not persist bad value', async () => {
    const settingsPath = await createTmpSettingsPath()
    const store = createSettingsStore(settingsPath)

    await expect(store.setIntervalMs(0 as unknown as number)).rejects.toThrow()
    await expect(store.setIntervalMs(Number.NaN)).rejects.toThrow()

    await expect(store.getSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  it('rejects non-boolean alwaysOnTop and does not persist bad value', async () => {
    const settingsPath = await createTmpSettingsPath()
    const store = createSettingsStore(settingsPath)

    await expect(store.setAlwaysOnTop('yes' as unknown as boolean)).rejects.toThrow()

    await expect(store.getSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })
})
