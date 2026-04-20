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

    await store.saveToken('abc-token')
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
})
