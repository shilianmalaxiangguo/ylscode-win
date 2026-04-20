<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent, formatUsd } from '../../shared/formatters.js'
import type { UsageCardSnapshot } from '../../shared/types.js'

const props = defineProps<{
  title: string
  usage: UsageCardSnapshot | null
}>()

const usedText = computed(() => formatUsd(props.usage?.usedUsd))
const totalText = computed(() => formatUsd(props.usage?.totalUsd))
const percentText = computed(() => {
  if (!props.usage) {
    return '--'
  }
  return formatPercent(props.usage.ratio * 100)
})
const progress = computed(() => {
  if (!props.usage) {
    return 0
  }
  return Math.max(0, Math.min(100, props.usage.ratio * 100))
})
</script>

<template>
  <section class="card">
    <p class="title">{{ title }}</p>
    <p class="value">{{ usedText }} / {{ totalText }}</p>
    <div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>
    <p class="percent">已用 {{ percentText }}</p>
  </section>
</template>

<style scoped>
.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.84);
  padding: 14px;
}

.title {
  margin: 0;
  font-size: 13px;
  color: #334155;
}

.value {
  margin: 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

.percent {
  margin: 8px 0 0;
  font-size: 12px;
  color: #475569;
}
</style>
