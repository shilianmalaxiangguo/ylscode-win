<script setup lang="ts">
import { computed } from 'vue'
import { formatUsd } from '../../shared/formatters.js'

const props = defineProps<{
  value: number | null | undefined
}>()

const displayValue = computed(() => formatUsd(props.value))
</script>

<template>
  <section class="card hero-card">
    <p class="card-label">剩余额度 (USD)</p>
    <p class="hero-value">{{ displayValue }}</p>
  </section>
</template>

<style scoped>
.card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(241, 246, 255, 0.72));
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  padding: 16px;
}

.card-label {
  margin: 0;
  font-size: 13px;
  color: #334155;
}

.hero-value {
  margin: 8px 0 0;
  font-size: 38px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}
</style>
