<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import QuotaUsageCard from './components/QuotaUsageCard.vue'
import SettingsCard from './components/SettingsCard.vue'
import TodayUsageCard from './components/TodayUsageCard.vue'
import { useDashboard } from './composables/useDashboard'

const dashboard = useDashboard()
const EMPTY_TOKEN_MESSAGE = '请先配置 Token'
const settingsBusy = ref(false)

const alwaysOnTopLabel = computed(() => (dashboard.alwaysOnTop.value ? '取消置顶' : '置顶'))
const showTokenEmptyHint = computed(() => dashboard.error.value === EMPTY_TOKEN_MESSAGE)
const planLabel = computed(() => {
  const raw = (dashboard.snapshot.value?.packageType ?? '').toLowerCase()
  if (raw.includes('max')) return 'Max'
  if (raw.includes('pro')) return 'Pro'
  if (raw.includes('free')) return 'Free'

  const dailyQuota = dashboard.snapshot.value?.current?.totalUsd ?? 0
  if (dailyQuota >= 200) return 'Max'
  if (dailyQuota >= 100) return 'Pro'
  return 'Free'
})
const packageDaysRemaining = computed(() => {
  const raw = dashboard.snapshot.value?.packageExpiresAt
  if (!raw) {
    return '--'
  }

  const target = new Date(raw)
  if (Number.isNaN(target.getTime())) {
    return '--'
  }

  const now = new Date()
  const currentUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const targetUtcDay = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate()
  )
  const days = Math.max(0, Math.floor((targetUtcDay - currentUtcDay) / (24 * 60 * 60 * 1000)))
  return String(days)
})
const subtitleLine = computed(() => {
  const email = dashboard.snapshot.value?.email ?? '--'
  const days = packageDaysRemaining.value
  return `${email} / 剩余 ${days} 天`
})
const readableError = computed(() => {
  if (!dashboard.error.value || dashboard.error.value === EMPTY_TOKEN_MESSAGE) {
    return null
  }
  return dashboard.error.value
})

const onSaveToken = async (token: string) => {
  if (settingsBusy.value) {
    return
  }
  settingsBusy.value = true
  try {
    await dashboard.saveToken(token)
  } finally {
    settingsBusy.value = false
  }
}

const onRefresh = async () => {
  await dashboard.refresh()
}

const onToggleAlwaysOnTop = async () => {
  await dashboard.toggleAlwaysOnTop(!dashboard.alwaysOnTop.value)
}

const onChangeInterval = async (pollingMs: number) => {
  if (settingsBusy.value) {
    return
  }
  settingsBusy.value = true
  try {
    await dashboard.changeInterval(pollingMs)
  } finally {
    settingsBusy.value = false
  }
}

onMounted(async () => {
  await dashboard.init()
})
</script>

<template>
  <UApp>
    <main class="widget-shell">
      <section class="widget-panel">
        <header class="topbar">
          <div class="headline-row">
            <h1>伊莉思Code</h1>
            <span class="plan-tag">{{ planLabel }}</span>
          </div>

          <p class="subtitle-line">{{ subtitleLine }}</p>

          <div class="actions">
            <UButton size="xs" color="neutral" variant="soft" :disabled="dashboard.loading.value" @click="onToggleAlwaysOnTop">
              {{ alwaysOnTopLabel }}
            </UButton>
            <UButton size="xs" :loading="dashboard.loading.value" @click="onRefresh">刷新</UButton>
          </div>
        </header>

        <UAlert
          v-if="readableError"
          color="error"
          variant="soft"
          :title="readableError"
      />
      <p v-else-if="showTokenEmptyHint" class="empty-token-hint">请先配置 Token</p>

      <section class="grid-two">
        <QuotaUsageCard title="当前额度 (USD)" :usage="dashboard.snapshot.value?.current ?? null" />
        <QuotaUsageCard title="本周额度 (USD)" :usage="dashboard.snapshot.value?.week ?? null" />
      </section>

      <TodayUsageCard :usage="dashboard.snapshot.value?.todayUsage ?? null" />

        <SettingsCard
          :token="dashboard.token.value"
          :polling-ms="dashboard.pollingMs.value"
          :interval-options="dashboard.intervalOptions"
          :busy="settingsBusy"
          @save-token="onSaveToken"
          @change-interval="onChangeInterval"
        />
      </section>
    </main>
  </UApp>
</template>

<style scoped>
.widget-shell {
  min-height: 100vh;
  padding: 14px;
  display: grid;
  place-items: start center;
}

.widget-panel {
  width: min(100%, 1040px);
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 24px;
  border: 1px solid rgba(0, 193, 106, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(247, 252, 249, 0.78)),
    radial-gradient(circle at top right, rgba(0, 193, 106, 0.08), transparent 28%);
  box-shadow:
    0 26px 80px rgba(0, 79, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "headline actions"
    "summary summary";
  align-items: center;
  gap: 10px 12px;
}

.headline-row {
  grid-area: headline;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1;
  font-weight: 800;
  color: #10271d;
  white-space: nowrap;
}

.summary-strip {
  grid-area: summary;
}

.subtitle-line {
  grid-area: summary;
  margin: 0;
  min-width: 0;
  color: #526a5d;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: 0.08em;
  background: linear-gradient(180deg, rgba(255, 224, 130, 0.52), rgba(255, 211, 79, 0.34));
  border: 1px solid rgba(224, 159, 0, 0.18);
  color: #8a5a00;
}

.actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: max-content;
}

.empty-token-hint {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px dashed rgba(0, 193, 106, 0.18);
  background: rgba(255, 255, 255, 0.62);
  color: #355846;
  font-size: 13px;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 560px) {
  .widget-shell {
    padding: 10px;
  }

  .widget-panel {
    padding: 12px;
    border-radius: 20px;
  }

  .topbar {
    gap: 8px 10px;
  }

  h1 {
    font-size: 17px;
  }

  .subtitle-line {
    font-size: 12px;
  }

  .actions {
    align-self: start;
  }

  .grid-two {
    grid-template-columns: 1fr;
  }
}
</style>
