# YLS Code Win MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows desktop widget MVP with Electron, Vite, Vue 3, and Nuxt UI that stores a token locally and displays YLS Codex quota information in USD.

**Architecture:** The Electron main process owns persistence, window controls, and the quota fetch so the renderer does not talk to Node APIs directly. The Vue renderer renders a single widget-style dashboard and calls a narrow preload bridge. Shared pure modules handle payload typing, fallback rules, date selection, USD formatting, and progress calculations so they can be tested in isolation.

**Tech Stack:** Electron, Vite, Vue 3, @nuxt/ui, Tailwind CSS, TypeScript, Vitest, Vue Test Utils

---

## File Map

- `package.json`
  - Scripts, dependencies, Vitest entrypoints, Electron main entry.
- `index.html`
  - Root HTML container with the `isolate` class required by Nuxt UI.
- `vite.config.ts`
  - Vue + Nuxt UI Vite plugins.
- `tsconfig.json`
  - Shared TypeScript base config.
- `tsconfig.app.json`
  - Renderer config, includes `auto-imports.d.ts` and `components.d.ts`.
- `tsconfig.node.json`
  - Vite/node config and Nuxt UI theme alias.
- `tsconfig.electron.json`
  - Main/preload TypeScript build into `dist-electron`.
- `src/main.ts`
  - Renderer bootstrap, Nuxt UI plugin registration, CSS import.
- `src/App.vue`
  - Widget shell, layout composition, empty/error/loading states.
- `src/assets/css/main.css`
  - Tailwind/Nuxt UI imports plus widget-specific theme variables.
- `src/composables/useDashboard.ts`
  - Loads settings, schedules polling, calls preload bridge, exposes actions/state.
- `src/components/HeroBalanceCard.vue`
  - Main remaining balance card.
- `src/components/QuotaUsageCard.vue`
  - Current/week usage cards with progress bars.
- `src/components/AccountInfoCard.vue`
  - Email, package total, expiry metadata.
- `src/components/SettingsCard.vue`
  - Token form, refresh interval selector, save action.
- `src/types/electron-api.d.ts`
  - `window.ylsDesktop` type declarations for the renderer.
- `shared/types.ts`
  - API payload types, app settings types, dashboard view-model types.
- `shared/formatters.ts`
  - USD/percent/date formatting helpers.
- `shared/mappers.ts`
  - Fallback logic from raw API payload to dashboard snapshot.
- `electron/store.ts`
  - Read/write JSON settings under Electron `userData`.
- `electron/quota-service.ts`
  - HTTP request to `/codex/info`, auth header, mapper call.
- `electron/ipc.ts`
  - Registers IPC handlers for settings, refresh, and always-on-top.
- `electron/preload.ts`
  - Context bridge exposing the renderer-safe API.
- `electron/main.ts`
  - BrowserWindow creation, state restore, IPC registration.
- `shared/__tests__/formatters.spec.ts`
  - Unit tests for USD/date formatting.
- `shared/__tests__/mappers.spec.ts`
  - Unit tests for quota fallback rules, ratios, and package selection.
- `electron/__tests__/store.spec.ts`
  - Unit tests for default settings and JSON persistence.
- `electron/__tests__/quota-service.spec.ts`
  - Unit tests for auth header usage and payload mapping.
- `src/composables/__tests__/useDashboard.spec.ts`
  - Unit tests for load, refresh, polling interval switch, and top toggle actions.
- `src/components/__tests__/App.spec.ts`
  - Renderer tests for empty state, loaded state, and error banner rendering.

## Task 1: Bootstrap the Electron + Vue + Nuxt UI shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.electron.json`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/assets/css/main.css`
- Create: `src/types/electron-api.d.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

- [ ] **Step 1: Write the bootstrap package and config files**

```json
{
  "name": "ylscode-win",
  "version": "0.1.0",
  "private": true,
  "description": "YLS Codex quota desktop widget",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev:renderer": "vite",
    "dev:electron:tsc": "tsc -p tsconfig.electron.json --watch --preserveWatchOutput",
    "dev:electron": "wait-on tcp:127.0.0.1:5173 dist-electron/main.js && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron .",
    "dev": "concurrently -k \"npm:dev:renderer\" \"npm:dev:electron:tsc\" \"npm:dev:electron\"",
    "build:renderer": "vite build",
    "build:electron": "tsc -p tsconfig.electron.json",
    "build": "npm run build:renderer && npm run build:electron",
    "typecheck": "vue-tsc --noEmit -p tsconfig.app.json",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@nuxt/ui": "^4.6.1",
    "tailwindcss": "^4.1.12",
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.1",
    "@vue/test-utils": "^2.4.6",
    "concurrently": "^9.2.0",
    "cross-env": "^7.0.3",
    "electron": "^39.0.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.9.2",
    "vite": "^7.1.3",
    "vitest": "^3.2.4",
    "vue-tsc": "^2.1.10",
    "wait-on": "^8.0.1"
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [vue(), ui()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
})
```

```json
// tsconfig.app.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": ["vite/client", "vitest/globals"],
    "paths": {
      "#build/ui/*": ["./node_modules/.nuxt-ui/ui/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.vue",
    "shared/**/*.ts",
    "auto-imports.d.ts",
    "components.d.ts"
  ]
}
```

```json
// tsconfig.node.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "paths": {
      "#build/ui": ["./node_modules/.nuxt-ui/ui"]
    }
  },
  "include": ["vite.config.ts"]
}
```

```json
// tsconfig.electron.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "dist-electron",
    "rootDir": ".",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "noEmit": false
  },
  "include": ["electron/**/*.ts", "shared/**/*.ts"]
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "allowJs": false,
    "resolveJsonModule": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "isolatedModules": true,
    "moduleDetection": "force",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "."
  }
}
```

- [ ] **Step 2: Add the renderer entry files**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YLS Code</title>
  </head>
  <body>
    <div id="app" class="isolate"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```ts
// src/main.ts
import './assets/css/main.css'
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

createApp(App).use(ui).mount('#app')
```

```css
/* src/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";

:root {
  --widget-bg: radial-gradient(circle at top left, #f8fbff 0%, #eef3ff 45%, #f8f6ef 100%);
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--widget-bg);
  color: #132238;
  font-family: "Segoe UI", sans-serif;
}

#app {
  min-height: 100vh;
}
```

```vue
<!-- src/App.vue -->
<template>
  <UApp>
    <main class="min-h-screen p-4">
      <section class="mx-auto max-w-[420px] rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(33,56,93,0.16)] backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">YLS Code</p>
            <h1 class="text-2xl font-semibold text-slate-900">Quota Widget</h1>
          </div>
          <UBadge color="neutral" variant="subtle">MVP</UBadge>
        </div>

        <div class="mt-6 rounded-2xl bg-slate-950 px-4 py-5 text-white">
          <p class="text-xs uppercase tracking-[0.24em] text-slate-300">剩余额度 (USD)</p>
          <p class="mt-3 text-4xl font-semibold">$--</p>
          <p class="mt-2 text-sm text-slate-300">请先配置 Token</p>
        </div>
      </section>
    </main>
  </UApp>
</template>
```

```ts
// src/types/electron-api.d.ts
export {}

declare global {
  interface Window {
    ylsDesktop: {
      noop: () => Promise<'pong'>
    }
  }
}
```

- [ ] **Step 3: Add the Electron shell files**

```ts
// electron/preload.ts
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ylsDesktop', {
  noop: async () => 'pong' as const
})
```

```ts
// electron/main.ts
import path from 'node:path'
import { app, BrowserWindow } from 'electron'

const createWindow = () => {
  const window = new BrowserWindow({
    width: 420,
    height: 520,
    minWidth: 380,
    minHeight: 480,
    autoHideMenuBar: true,
    backgroundColor: '#f3f6fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: install completes without peer dependency errors.

- [ ] **Step 5: Write the failing renderer shell test**

```ts
// src/components/__tests__/App.spec.ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import App from '../../App.vue'

describe('App shell', () => {
  it('renders the widget title and empty-state prompt', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [ui]
      }
    })

    expect(wrapper.text()).toContain('YLS Code')
    expect(wrapper.text()).toContain('剩余额度 (USD)')
    expect(wrapper.text()).toContain('请先配置 Token')
  })
})
```

- [ ] **Step 6: Run the test to verify the shell is wired correctly**

Run:

```bash
npm run test:run -- src/components/__tests__/App.spec.ts
```

Expected: PASS

- [ ] **Step 7: Run the typecheck and production build smoke checks**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands PASS and create `dist/` plus `dist-electron/`.

- [ ] **Step 8: Commit**

```bash
git add package.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json tsconfig.electron.json src electron
git commit -m "feat: bootstrap electron vue widget shell"
```

## Task 2: Add shared quota types, USD formatting, and API mapping

**Files:**
- Create: `shared/types.ts`
- Create: `shared/formatters.ts`
- Create: `shared/mappers.ts`
- Create: `shared/__tests__/formatters.spec.ts`
- Create: `shared/__tests__/mappers.spec.ts`

- [ ] **Step 1: Write the failing formatter tests**

```ts
// shared/__tests__/formatters.spec.ts
import { describe, expect, it } from 'vitest'
import { formatPercent, formatUsd } from '../formatters'

describe('formatUsd', () => {
  it('formats whole numbers without forced decimals', () => {
    expect(formatUsd(12340)).toBe('$12,340')
  })

  it('formats decimals with up to two digits', () => {
    expect(formatUsd(12340.5)).toBe('$12,340.50')
  })

  it('returns placeholder for nullish values', () => {
    expect(formatUsd(null)).toBe('$--')
  })
})

describe('formatPercent', () => {
  it('rounds to one decimal and appends %', () => {
    expect(formatPercent(38.333)).toBe('38.3%')
  })
})
```

- [ ] **Step 2: Write the failing mapper tests**

```ts
// shared/__tests__/mappers.spec.ts
import { describe, expect, it } from 'vitest'
import { mapApiEnvelopeToSnapshot } from '../mappers'

const envelope = {
  code: 200,
  state: {
    user: { email: 'demo@example.com' },
    remaining_quota: 245000,
    userPackgeUsage: {
      remaining_quota: 380,
      total_quota: 500,
      used_percentage: 24
    },
    userPackgeUsage_week: {
      remaining_quota: 740,
      total_quota: 1000
    },
    package: {
      total_quota: 500000,
      weeklyQuota: 1000,
      packages: [
        {
          package_type: 'pro_yearly',
          package_status: 'active',
          start_at: '2026-04-01T00:00:00Z',
          expires_at: '2026-05-01T00:00:00Z'
        }
      ]
    }
  }
}

describe('mapApiEnvelopeToSnapshot', () => {
  it('maps remaining, current, and weekly quota values', () => {
    const snapshot = mapApiEnvelopeToSnapshot(envelope)

    expect(snapshot.remainingUsd).toBe(245000)
    expect(snapshot.current.usedUsd).toBe(120)
    expect(snapshot.current.totalUsd).toBe(500)
    expect(snapshot.week.usedUsd).toBe(260)
    expect(snapshot.email).toBe('demo@example.com')
    expect(snapshot.packageTotalUsd).toBe(500000)
    expect(snapshot.packageExpiresAt).toBe('2026-05-01T00:00:00Z')
  })

  it('falls back to placeholders when weekly data is missing', () => {
    const snapshot = mapApiEnvelopeToSnapshot({
      ...envelope,
      state: { ...envelope.state, userPackgeUsage_week: undefined }
    })

    expect(snapshot.week).toBeNull()
  })
})
```

- [ ] **Step 3: Run the tests to capture the missing shared modules**

Run:

```bash
npm run test:run -- shared/__tests__/formatters.spec.ts shared/__tests__/mappers.spec.ts
```

Expected: FAIL with module-not-found errors for `../formatters` and `../mappers`.

- [ ] **Step 4: Implement the shared types and helpers**

```ts
// shared/types.ts
export interface UsagePayload {
  remaining_quota?: number | string | null
  used_percentage?: number | string | null
  total_cost?: number | string | null
  total_quota?: number | string | null
}

export interface PackageItem {
  package_type?: string | null
  package_status?: string | null
  start_at?: string | null
  expires_at?: string | null
}

export interface PackagePayload {
  total_quota?: number | string | null
  weeklyQuota?: number | string | null
  packages?: PackageItem[] | null
}

export interface ApiEnvelope {
  code?: number
  msg?: string
  error?: string
  details?: string
  state?: {
    user?: { email?: string | null } | null
    package?: PackagePayload | null
    userPackgeUsage?: UsagePayload | null
    userPackgeUsage_week?: UsagePayload | null
    remaining_quota?: number | string | null
  } | null
}

export interface UsageCardSnapshot {
  usedUsd: number
  totalUsd: number
  ratio: number
}

export interface DashboardSnapshot {
  remainingUsd: number | null
  current: UsageCardSnapshot | null
  week: UsageCardSnapshot | null
  email: string | null
  packageTotalUsd: number | null
  packageExpiresAt: string | null
}
```

```ts
// shared/formatters.ts
export const formatUsd = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '$--'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatPercent = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '--'
  return `${value.toFixed(1)}%`
}
```

```ts
// shared/mappers.ts
import type { ApiEnvelope, DashboardSnapshot, PackageItem, UsageCardSnapshot, UsagePayload } from './types'

const toNumber = (value: number | string | null | undefined) => {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toCard = (usage?: UsagePayload | null): UsageCardSnapshot | null => {
  const total = toNumber(usage?.total_quota)
  const remaining = toNumber(usage?.remaining_quota)
  if (total == null || remaining == null || total <= 0) return null

  const used = Math.max(0, total - remaining)
  const fromApi = toNumber(usage?.used_percentage)
  const ratio = fromApi != null ? Math.max(0, Math.min(1, fromApi / 100)) : used / total

  return { usedUsd: used, totalUsd: total, ratio }
}

const pickActivePackage = (packages?: PackageItem[] | null) => {
  if (!packages?.length) return null

  return [...packages]
    .filter(item => item.expires_at)
    .sort((left, right) => String(left.expires_at).localeCompare(String(right.expires_at)))
    .find(item => (item.package_status ?? '').toLowerCase() === 'active') ?? packages[0]
}

export const mapApiEnvelopeToSnapshot = (envelope: ApiEnvelope): DashboardSnapshot => {
  const state = envelope.state
  const activePackage = pickActivePackage(state?.package?.packages)

  return {
    remainingUsd:
      toNumber(state?.remaining_quota) ??
      toNumber(state?.userPackgeUsage?.remaining_quota) ??
      toNumber(state?.userPackgeUsage_week?.remaining_quota),
    current: toCard(state?.userPackgeUsage),
    week: toCard(state?.userPackgeUsage_week),
    email: state?.user?.email ?? null,
    packageTotalUsd: toNumber(state?.package?.total_quota),
    packageExpiresAt: activePackage?.expires_at ?? null
  }
}
```

- [ ] **Step 5: Run the shared tests**

Run:

```bash
npm run test:run -- shared/__tests__/formatters.spec.ts shared/__tests__/mappers.spec.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add shared
git commit -m "feat: add shared quota mapping helpers"
```

## Task 3: Add settings persistence, quota fetch service, and IPC bridge

**Files:**
- Create: `electron/store.ts`
- Create: `electron/quota-service.ts`
- Create: `electron/ipc.ts`
- Create: `electron/__tests__/store.spec.ts`
- Create: `electron/__tests__/quota-service.spec.ts`
- Modify: `electron/preload.ts`
- Modify: `electron/main.ts`
- Modify: `src/types/electron-api.d.ts`

- [ ] **Step 1: Write the failing persistence tests**

```ts
// electron/__tests__/store.spec.ts
import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { defaultSettings, loadSettings, saveSettings } from '../store'

describe('store', () => {
  it('returns defaults when the file does not exist', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'yls-store-'))
    const file = path.join(dir, 'settings.json')

    await expect(loadSettings(file)).resolves.toEqual(defaultSettings)
  })

  it('persists token, interval, and top state', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'yls-store-'))
    const file = path.join(dir, 'settings.json')

    const saved = await saveSettings(file, {
      token: 'abc123',
      pollingMs: 30000,
      alwaysOnTop: true
    })

    expect(saved.token).toBe('abc123')
    expect(saved.pollingMs).toBe(30000)
    expect(saved.alwaysOnTop).toBe(true)
    expect(JSON.parse(await readFile(file, 'utf8')).token).toBe('abc123')
  })
})
```

- [ ] **Step 2: Write the failing quota service test**

```ts
// electron/__tests__/quota-service.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { fetchQuotaSnapshot } from '../quota-service'

describe('fetchQuotaSnapshot', () => {
  it('sends the bearer token and maps the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 200,
        state: {
          remaining_quota: 1200,
          userPackgeUsage: { remaining_quota: 50, total_quota: 100 },
          package: { total_quota: 3000, packages: [] }
        }
      })
    })

    const snapshot = await fetchQuotaSnapshot('demo-token', fetchImpl as typeof fetch)

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://codex.ylsagi.com/codex/info',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token'
        })
      })
    )
    expect(snapshot.remainingUsd).toBe(1200)
  })
})
```

- [ ] **Step 3: Run the tests to confirm the Electron service layer is missing**

Run:

```bash
npm run test:run -- electron/__tests__/store.spec.ts electron/__tests__/quota-service.spec.ts
```

Expected: FAIL with module-not-found errors for `../store` and `../quota-service`.

- [ ] **Step 4: Implement settings persistence and quota fetching**

```ts
// electron/store.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface StoredSettings {
  token: string
  pollingMs: number
  alwaysOnTop: boolean
}

export const defaultSettings: StoredSettings = {
  token: '',
  pollingMs: 60000,
  alwaysOnTop: false
}

export const loadSettings = async (filePath: string): Promise<StoredSettings> => {
  try {
    const raw = JSON.parse(await readFile(filePath, 'utf8')) as Partial<StoredSettings>
    return {
      token: raw.token ?? '',
      pollingMs: raw.pollingMs ?? 60000,
      alwaysOnTop: raw.alwaysOnTop ?? false
    }
  } catch {
    return defaultSettings
  }
}

export const saveSettings = async (
  filePath: string,
  patch: Partial<StoredSettings>
): Promise<StoredSettings> => {
  const current = await loadSettings(filePath)
  const next = { ...current, ...patch }

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(next, null, 2), 'utf8')
  return next
}
```

```ts
// electron/quota-service.ts
import { mapApiEnvelopeToSnapshot } from '../shared/mappers'

export const fetchQuotaSnapshot = async (
  token: string,
  fetchImpl: typeof fetch = fetch
) => {
  const response = await fetchImpl('https://codex.ylsagi.com/codex/info', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return mapApiEnvelopeToSnapshot(await response.json())
}
```

- [ ] **Step 5: Implement IPC registration and preload bridge**

```ts
// electron/ipc.ts
import { ipcMain, BrowserWindow } from 'electron'
import path from 'node:path'
import { fetchQuotaSnapshot } from './quota-service'
import { loadSettings, saveSettings } from './store'

export const registerIpcHandlers = (window: BrowserWindow, userDataPath: string) => {
  const settingsFile = path.join(userDataPath, 'settings.json')

  ipcMain.handle('settings:get', async () => loadSettings(settingsFile))
  ipcMain.handle('settings:save-token', async (_event, token: string) => saveSettings(settingsFile, { token }))
  ipcMain.handle('settings:set-interval', async (_event, pollingMs: number) =>
    saveSettings(settingsFile, { pollingMs })
  )
  ipcMain.handle('window:set-always-on-top', async (_event, alwaysOnTop: boolean) => {
    window.setAlwaysOnTop(alwaysOnTop)
    return saveSettings(settingsFile, { alwaysOnTop })
  })
  ipcMain.handle('quota:fetch', async () => {
    const settings = await loadSettings(settingsFile)
    if (!settings.token) {
      throw new Error('Token is required')
    }
    return fetchQuotaSnapshot(settings.token)
  })
}
```

```ts
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ylsDesktop', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveToken: (token: string) => ipcRenderer.invoke('settings:save-token', token),
  setIntervalMs: (pollingMs: number) => ipcRenderer.invoke('settings:set-interval', pollingMs),
  setAlwaysOnTop: (alwaysOnTop: boolean) => ipcRenderer.invoke('window:set-always-on-top', alwaysOnTop),
  fetchQuotaSnapshot: () => ipcRenderer.invoke('quota:fetch')
})
```

```ts
// src/types/electron-api.d.ts
import type { DashboardSnapshot } from '../../shared/types'

export {}

declare global {
  interface Window {
    ylsDesktop: {
      getSettings: () => Promise<{ token: string; pollingMs: number; alwaysOnTop: boolean }>
      saveToken: (token: string) => Promise<{ token: string; pollingMs: number; alwaysOnTop: boolean }>
      setIntervalMs: (pollingMs: number) => Promise<{ token: string; pollingMs: number; alwaysOnTop: boolean }>
      setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{ token: string; pollingMs: number; alwaysOnTop: boolean }>
      fetchQuotaSnapshot: () => Promise<DashboardSnapshot>
    }
  }
}
```

- [ ] **Step 6: Wire the BrowserWindow to the IPC handlers**

```ts
// electron/main.ts
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 420,
    height: 520,
    minWidth: 380,
    minHeight: 480,
    autoHideMenuBar: true,
    backgroundColor: '#f3f6fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  registerIpcHandlers(window, app.getPath('userData'))

  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) {
    await window.loadURL(devServerUrl)
  } else {
    await window.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}
```

- [ ] **Step 7: Run the Electron-layer tests**

Run:

```bash
npm run test:run -- electron/__tests__/store.spec.ts electron/__tests__/quota-service.spec.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add electron src/types/electron-api.d.ts
git commit -m "feat: add electron settings and quota ipc"
```

## Task 4: Add dashboard state management with polling and widget actions

**Files:**
- Create: `src/composables/useDashboard.ts`
- Create: `src/composables/__tests__/useDashboard.spec.ts`

- [ ] **Step 1: Write the failing composable tests**

```ts
// src/composables/__tests__/useDashboard.spec.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useDashboard } from '../useDashboard'

describe('useDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.ylsDesktop = {
      getSettings: vi.fn().mockResolvedValue({ token: 'demo', pollingMs: 60000, alwaysOnTop: false }),
      saveToken: vi.fn().mockResolvedValue({ token: 'changed', pollingMs: 60000, alwaysOnTop: false }),
      setIntervalMs: vi.fn().mockResolvedValue({ token: 'demo', pollingMs: 30000, alwaysOnTop: false }),
      setAlwaysOnTop: vi.fn().mockResolvedValue({ token: 'demo', pollingMs: 60000, alwaysOnTop: true }),
      fetchQuotaSnapshot: vi.fn().mockResolvedValue({
        remainingUsd: 2400,
        current: { usedUsd: 120, totalUsd: 500, ratio: 0.24 },
        week: null,
        email: 'demo@example.com',
        packageTotalUsd: 5000,
        packageExpiresAt: '2026-05-01T00:00:00Z'
      })
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads settings and refreshes immediately', async () => {
    const model = useDashboard()
    await model.init()
    await nextTick()

    expect(window.ylsDesktop.getSettings).toHaveBeenCalled()
    expect(window.ylsDesktop.fetchQuotaSnapshot).toHaveBeenCalled()
    expect(model.snapshot.value?.remainingUsd).toBe(2400)
  })

  it('restarts polling when interval changes', async () => {
    const model = useDashboard()
    await model.init()
    await model.changeInterval(30000)

    vi.advanceTimersByTime(30000)

    expect(window.ylsDesktop.setIntervalMs).toHaveBeenCalledWith(30000)
    expect(window.ylsDesktop.fetchQuotaSnapshot).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the test to capture the missing composable**

Run:

```bash
npm run test:run -- src/composables/__tests__/useDashboard.spec.ts
```

Expected: FAIL with module-not-found for `../useDashboard`.

- [ ] **Step 3: Implement the dashboard composable**

```ts
// src/composables/useDashboard.ts
import { computed, onBeforeUnmount, ref } from 'vue'
import type { DashboardSnapshot } from '../../shared/types'

export const intervalOptions = [
  { label: '5s', value: 5000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
  { label: '3min', value: 180000 },
  { label: '5min', value: 300000 },
  { label: '10min', value: 600000 }
] as const

export const useDashboard = () => {
  const snapshot = ref<DashboardSnapshot | null>(null)
  const token = ref('')
  const pollingMs = ref(60000)
  const alwaysOnTop = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let timer: ReturnType<typeof window.setInterval> | null = null

  const stopPolling = () => {
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  }

  const refresh = async () => {
    loading.value = true
    error.value = null
    try {
      snapshot.value = await window.ylsDesktop.fetchQuotaSnapshot()
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : '刷新失败'
    } finally {
      loading.value = false
    }
  }

  const startPolling = () => {
    stopPolling()
    timer = window.setInterval(() => {
      void refresh()
    }, pollingMs.value)
  }

  const init = async () => {
    const settings = await window.ylsDesktop.getSettings()
    token.value = settings.token
    pollingMs.value = settings.pollingMs
    alwaysOnTop.value = settings.alwaysOnTop

    if (token.value) {
      await refresh()
      startPolling()
    }
  }

  const saveToken = async (nextToken: string) => {
    if (!nextToken.trim()) {
      token.value = ''
      snapshot.value = null
      error.value = '请先配置 Token'
      stopPolling()
      return
    }

    const settings = await window.ylsDesktop.saveToken(nextToken)
    token.value = settings.token
    pollingMs.value = settings.pollingMs
    await refresh()
    startPolling()
  }

  const changeInterval = async (nextPollingMs: number) => {
    const settings = await window.ylsDesktop.setIntervalMs(nextPollingMs)
    pollingMs.value = settings.pollingMs
    startPolling()
  }

  const toggleAlwaysOnTop = async (value: boolean) => {
    const settings = await window.ylsDesktop.setAlwaysOnTop(value)
    alwaysOnTop.value = settings.alwaysOnTop
  }

  onBeforeUnmount(stopPolling)

  return {
    snapshot,
    token,
    pollingMs,
    alwaysOnTop,
    loading,
    error,
    intervalOptions,
    hasSnapshot: computed(() => snapshot.value !== null),
    init,
    refresh,
    saveToken,
    changeInterval,
    toggleAlwaysOnTop
  }
}
```

- [ ] **Step 4: Run the composable tests**

Run:

```bash
npm run test:run -- src/composables/__tests__/useDashboard.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/composables
git commit -m "feat: add dashboard polling state"
```

## Task 5: Build the widget UI and render live data

**Files:**
- Create: `src/components/HeroBalanceCard.vue`
- Create: `src/components/QuotaUsageCard.vue`
- Create: `src/components/AccountInfoCard.vue`
- Create: `src/components/SettingsCard.vue`
- Modify: `src/App.vue`
- Modify: `shared/formatters.ts`
- Modify: `src/components/__tests__/App.spec.ts`

- [ ] **Step 1: Replace the shell test with a failing loaded-state test**

```ts
// src/components/__tests__/App.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ui from '@nuxt/ui/vue-plugin'
import App from '../../App.vue'

describe('App', () => {
  it('renders loaded quota data and actions', async () => {
    window.ylsDesktop = {
      getSettings: vi.fn().mockResolvedValue({ token: 'demo', pollingMs: 60000, alwaysOnTop: true }),
      saveToken: vi.fn(),
      setIntervalMs: vi.fn(),
      setAlwaysOnTop: vi.fn(),
      fetchQuotaSnapshot: vi.fn().mockResolvedValue({
        remainingUsd: 2400,
        current: { usedUsd: 120, totalUsd: 500, ratio: 0.24 },
        week: { usedUsd: 260, totalUsd: 1000, ratio: 0.26 },
        email: 'demo@example.com',
        packageTotalUsd: 5000,
        packageExpiresAt: '2026-05-01T00:00:00Z'
      })
    }

    const wrapper = mount(App, {
      global: {
        plugins: [ui]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('$2,400')
    expect(wrapper.text()).toContain('当前额度 (USD)')
    expect(wrapper.text()).toContain('本周额度 (USD)')
    expect(wrapper.text()).toContain('demo@example.com')
    expect(wrapper.text()).toContain('$5,000')
    expect(wrapper.text()).toContain('置顶')
    expect(wrapper.text()).toContain('刷新')
  })
})
```

- [ ] **Step 2: Run the App test to verify the richer UI is still missing**

Run:

```bash
npm run test:run -- src/components/__tests__/App.spec.ts
```

Expected: FAIL because the shell still shows `$--` and does not render the loaded cards.

- [ ] **Step 3: Extend shared formatting with a compact ISO-date formatter**

```ts
// shared/formatters.ts
export const formatDate = (value: string | null | undefined) => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}
```

- [ ] **Step 4: Add the presentational components**

```vue
<!-- src/components/HeroBalanceCard.vue -->
<script setup lang="ts">
defineProps<{ value: string; status: string }>()
</script>

<template>
  <section class="rounded-[24px] bg-slate-950 px-5 py-6 text-white">
    <p class="text-xs uppercase tracking-[0.24em] text-slate-300">剩余额度 (USD)</p>
    <p class="mt-3 text-4xl font-semibold">{{ value }}</p>
    <p class="mt-2 text-sm text-slate-300">{{ status }}</p>
  </section>
</template>
```

```vue
<!-- src/components/QuotaUsageCard.vue -->
<script setup lang="ts">
defineProps<{ title: string; used: string; total: string; ratio: number | null }>()
</script>

<template>
  <section class="rounded-[22px] border border-slate-200/70 bg-white/85 p-4 shadow-sm">
    <p class="text-sm font-semibold text-slate-500">{{ title }}</p>
    <p class="mt-3 text-xl font-semibold text-slate-900">{{ used }} / {{ total }}</p>
    <div class="mt-4 h-2 rounded-full bg-slate-200">
      <div
        class="h-2 rounded-full bg-linear-to-r from-sky-500 to-emerald-400 transition-all"
        :style="{ width: `${Math.max(6, (ratio ?? 0) * 100)}%` }"
      />
    </div>
  </section>
</template>
```

```vue
<!-- src/components/AccountInfoCard.vue -->
<script setup lang="ts">
defineProps<{ email: string; packageTotal: string; expiresAt: string }>()
</script>

<template>
  <section class="rounded-[22px] border border-slate-200/70 bg-white/80 p-4 shadow-sm">
    <dl class="space-y-3 text-sm text-slate-700">
      <div class="flex items-center justify-between gap-4">
        <dt class="text-slate-500">账号邮箱</dt>
        <dd class="truncate font-medium">{{ email }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-slate-500">套餐总额度 (USD)</dt>
        <dd class="font-medium">{{ packageTotal }}</dd>
      </div>
      <div class="flex items-center justify-between gap-4">
        <dt class="text-slate-500">套餐到期时间</dt>
        <dd class="font-medium">{{ expiresAt }}</dd>
      </div>
    </dl>
  </section>
</template>
```

```vue
<!-- src/components/SettingsCard.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  pollingMs: number
  options: ReadonlyArray<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  save: []
  intervalChange: [number]
}>()

const localToken = ref(props.modelValue)
watch(() => props.modelValue, value => {
  localToken.value = value
})
</script>

<template>
  <section class="rounded-[22px] border border-slate-200/70 bg-white/80 p-4 shadow-sm">
    <div class="space-y-4">
      <div>
        <label class="mb-2 block text-sm font-medium text-slate-600">Token</label>
        <UInput
          :model-value="localToken"
          type="password"
          placeholder="输入 Bearer Token"
          @update:model-value="value => emit('update:modelValue', String(value ?? ''))"
        />
      </div>

      <div class="flex items-center gap-3">
        <USelect
          :items="options"
          :model-value="pollingMs"
          class="min-w-32"
          @update:model-value="value => emit('intervalChange', Number(value))"
        />
        <UButton color="neutral" variant="soft" @click="emit('save')">保存 Token</UButton>
      </div>
    </div>
  </section>
</template>
```

- [ ] **Step 5: Replace `src/App.vue` with the full widget composition**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AccountInfoCard from './components/AccountInfoCard.vue'
import HeroBalanceCard from './components/HeroBalanceCard.vue'
import QuotaUsageCard from './components/QuotaUsageCard.vue'
import SettingsCard from './components/SettingsCard.vue'
import { useDashboard } from './composables/useDashboard'
import { formatDate, formatUsd } from '../shared/formatters'

const model = useDashboard()

const tokenDraft = computed({
  get: () => model.token.value,
  set: value => {
    model.token.value = value
  }
})

onMounted(() => {
  void model.init()
})
</script>

<template>
  <UApp>
    <main class="min-h-screen p-4">
      <section class="mx-auto max-w-[420px] rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_24px_80px_rgba(33,56,93,0.16)] backdrop-blur-xl">
        <header class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">YLS Code</p>
            <h1 class="text-2xl font-semibold text-slate-900">Quota Widget</h1>
          </div>

          <div class="flex gap-2">
            <UButton color="neutral" variant="soft" @click="model.toggleAlwaysOnTop(!model.alwaysOnTop.value)">
              {{ model.alwaysOnTop.value ? '取消置顶' : '置顶' }}
            </UButton>
            <UButton color="primary" variant="solid" :loading="model.loading.value" @click="model.refresh()">
              刷新
            </UButton>
          </div>
        </header>

        <UAlert
          v-if="model.error.value"
          class="mt-4"
          color="error"
          variant="soft"
          :title="model.error.value"
        />

        <div class="mt-4 space-y-4">
          <HeroBalanceCard
            :value="formatUsd(model.snapshot.value?.remainingUsd ?? null)"
            :status="model.snapshot.value ? '最近数据已刷新' : '请先配置 Token'"
          />

          <div class="grid grid-cols-2 gap-4">
            <QuotaUsageCard
              title="当前额度 (USD)"
              :used="formatUsd(model.snapshot.value?.current?.usedUsd ?? null)"
              :total="formatUsd(model.snapshot.value?.current?.totalUsd ?? null)"
              :ratio="model.snapshot.value?.current?.ratio ?? null"
            />
            <QuotaUsageCard
              title="本周额度 (USD)"
              :used="formatUsd(model.snapshot.value?.week?.usedUsd ?? null)"
              :total="formatUsd(model.snapshot.value?.week?.totalUsd ?? null)"
              :ratio="model.snapshot.value?.week?.ratio ?? null"
            />
          </div>

          <AccountInfoCard
            :email="model.snapshot.value?.email ?? '--'"
            :package-total="formatUsd(model.snapshot.value?.packageTotalUsd ?? null)"
            :expires-at="formatDate(model.snapshot.value?.packageExpiresAt)"
          />

          <SettingsCard
            v-model="tokenDraft"
            :polling-ms="model.pollingMs.value"
            :options="model.intervalOptions"
            @save="model.saveToken(model.token.value)"
            @interval-change="model.changeInterval"
          />
        </div>
      </section>
    </main>
  </UApp>
</template>
```

- [ ] **Step 6: Run the App test and the renderer test suite**

Run:

```bash
npm run test:run -- src/components/__tests__/App.spec.ts src/composables/__tests__/useDashboard.spec.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src shared/formatters.ts
git commit -m "feat: build quota widget dashboard ui"
```

## Task 6: Verify the full MVP and capture manual QA results

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add quick-start instructions to the README**

```md
## Development

~~~bash
npm install
npm run dev
~~~

## Test

~~~bash
npm run test:run
npm run typecheck
npm run build
~~~
```

- [ ] **Step 2: Run the full automated verification suite**

Run:

```bash
npm run test:run
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 3: Run the manual widget verification checklist**

Run:

```bash
npm run dev
```

Expected manual checks:

- Window opens at a compact widget size.
- Token can be saved and survives app restart.
- Remaining/current/week cards render in USD.
- Interval switcher supports `5s`, `30s`, `60s`, `3min`, `5min`, `10min`.
- Default interval is `60s`.
- Refresh button forces an immediate fetch.
- Top toggle changes the window to always-on-top and survives restart.
- Missing weekly data shows `--` instead of crashing.

- [ ] **Step 4: Commit the docs and final polish**

```bash
git add README.md
git commit -m "docs: add widget development instructions"
```
