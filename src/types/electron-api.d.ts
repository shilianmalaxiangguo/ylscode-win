export {}

import type { DashboardSnapshot } from '../../shared/types.js'

interface WidgetSettings {
  token: string
  pollingMs: number
  alwaysOnTop: boolean
}

declare global {
  interface Window {
    ylsDesktop: {
      getSettings: () => Promise<WidgetSettings>
      saveToken: (token: string) => Promise<WidgetSettings>
      setIntervalMs: (pollingMs: number) => Promise<WidgetSettings>
      setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<WidgetSettings>
      fetchQuotaSnapshot: () => Promise<DashboardSnapshot>
    }
  }
}
