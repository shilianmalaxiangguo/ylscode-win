<script setup lang="ts">
import { computed, onMounted } from 'vue'
import HeroBalanceCard from './components/HeroBalanceCard.vue'
import QuotaUsageCard from './components/QuotaUsageCard.vue'
import AccountInfoCard from './components/AccountInfoCard.vue'
import SettingsCard from './components/SettingsCard.vue'
import { useDashboard } from './composables/useDashboard'

const dashboard = useDashboard()

const alwaysOnTopLabel = computed(() => (dashboard.alwaysOnTop.value ? '取消置顶' : '置顶'))
const showTokenEmptyHint = computed(() => !dashboard.token.value.trim())
const readableError = computed(() => {
  if (!dashboard.error.value || showTokenEmptyHint.value) {
    return null
  }
  return dashboard.error.value
})

const onSaveToken = async (token: string) => {
  await dashboard.saveToken(token)
}

const onRefresh = async () => {
  await dashboard.refresh()
}

const onToggleAlwaysOnTop = async () => {
  await dashboard.toggleAlwaysOnTop(!dashboard.alwaysOnTop.value)
}

const onChangeInterval = async (pollingMs: number) => {
  await dashboard.changeInterval(pollingMs)
}

onMounted(async () => {
  await dashboard.init()
})
</script>

<template>
  <UApp>
    <main class="widget-shell">
      <header class="topbar">
        <h1>YLS Code</h1>
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

      <HeroBalanceCard :value="dashboard.snapshot.value?.remainingUsd" />

      <section class="grid-two">
        <QuotaUsageCard title="当前额度 (USD)" :usage="dashboard.snapshot.value?.current ?? null" />
        <QuotaUsageCard title="本周额度 (USD)" :usage="dashboard.snapshot.value?.week ?? null" />
      </section>

      <AccountInfoCard
        :email="dashboard.snapshot.value?.email ?? null"
        :package-total-usd="dashboard.snapshot.value?.packageTotalUsd ?? null"
        :package-expires-at="dashboard.snapshot.value?.packageExpiresAt ?? null"
      />

      <SettingsCard
        :token="dashboard.token.value"
        :polling-ms="dashboard.pollingMs.value"
        :interval-options="dashboard.intervalOptions"
        :loading="dashboard.loading.value"
        @save-token="onSaveToken"
        @change-interval="onChangeInterval"
      />
    </main>
  </UApp>
</template>

<style scoped>
.widget-shell {
  min-height: 100vh;
  padding: 14px;
  display: grid;
  gap: 12px;
  background:
    radial-gradient(circle at 12% 0%, rgba(96, 165, 250, 0.2), transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.24), transparent 35%),
    linear-gradient(160deg, #f8fafc 0%, #edf4ff 56%, #f4f7fb 100%);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-token-hint {
  margin: 0;
  color: #334155;
  font-size: 13px;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 560px) {
  .grid-two {
    grid-template-columns: 1fr;
  }
}
</style>
