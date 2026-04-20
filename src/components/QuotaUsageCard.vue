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
    <div class="card-head">
      <p class="title">{{ title }}</p>
      <span class="badge">{{ percentText }}</span>
    </div>
    <div class="value-row">
      <p class="value">{{ usedText }}</p>
      <p class="total">/ {{ totalText }}</p>
    </div>
    <div class="progress-track" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>
    <div class="foot-row">
      <p class="percent">已用额度</p>
      <p class="foot-note">{{ percentText }}</p>
    </div>
  </section>
</template>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(0, 193, 106, 0.12);
  background:
    radial-gradient(circle at top right, rgba(0, 193, 106, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 252, 248, 0.86));
  box-shadow: 0 14px 32px rgba(0, 88, 48, 0.06);
  padding: 18px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2f5f47;
}

.badge {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(0, 193, 106, 0.1);
  color: #0b7c45;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 16px 0 14px;
}

.value {
  margin: 0;
  font-size: clamp(26px, 4vw, 32px);
  line-height: 1;
  font-weight: 700;
  color: #0c2519;
}

.total {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #537062;
}

.progress-track {
  height: 12px;
  border-radius: 999px;
  border: 1px solid rgba(19, 168, 97, 0.16);
  background: rgba(0, 193, 106, 0.12);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(rgb(36, 199, 111) 0%, rgb(19, 168, 97) 100%);
  box-shadow:
    0 0 0 1px rgba(19, 168, 97, 0.08),
    0 6px 16px rgba(19, 168, 97, 0.28);
}

.foot-row {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.percent {
  margin: 0;
  font-size: 12px;
  color: #3f6c56;
}

.foot-note {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #5a7b69;
}
</style>
