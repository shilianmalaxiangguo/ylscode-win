<script setup lang="ts">
import { computed } from 'vue'
import { formatCompactCount, formatInteger } from '../../shared/formatters.js'
import type { TodayUsageSnapshot } from '../../shared/types.js'

const props = defineProps<{
  usage: TodayUsageSnapshot | null
}>()

const items = computed(() => [
  {
    label: '请求次数',
    value: formatInteger(props.usage?.requestCount)
  },
  {
    label: '输入 Token',
    value: formatCompactCount(props.usage?.inputTokens)
  },
  {
    label: '缓存 Token',
    value: formatCompactCount(props.usage?.cachedInputTokens)
  },
  {
    label: '输出 Token',
    value: formatCompactCount(props.usage?.outputTokens)
  }
])
</script>

<template>
  <section class="card today-usage-card">
    <div class="card-head">
      <h2>今日明细</h2>
      <span class="chip">Tokens</span>
    </div>

    <div class="metric-grid">
      <div v-for="item in items" :key="item.label" class="metric-item">
        <p class="metric-label">{{ item.label }}</p>
        <p class="metric-value">{{ item.value }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  border-radius: 20px;
  border: 1px solid rgba(0, 193, 106, 0.13);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 252, 249, 0.84));
  box-shadow: 0 10px 26px rgba(0, 88, 48, 0.06);
  padding: 18px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #12422b;
}

.chip {
  border-radius: 999px;
  padding: 5px 9px;
  background: rgba(0, 193, 106, 0.12);
  color: #0b7c45;
  font-size: 11px;
  font-weight: 700;
}

.metric-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-item {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 193, 106, 0.1);
  padding: 12px;
}

.metric-label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #5a7a68;
}

.metric-value {
  margin: 0;
  font-size: clamp(18px, 3vw, 22px);
  line-height: 1.1;
  font-weight: 700;
  color: #123222;
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
