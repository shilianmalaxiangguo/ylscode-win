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
    <div class="hero-head">
      <p class="card-label">剩余额度 (USD)</p>
      <span class="hero-chip">SaaS overview</span>
    </div>
    <p class="hero-value">{{ displayValue }}</p>
    <p class="hero-meta">Remaining package balance shown in USD</p>
  </section>
</template>

<style scoped>
.card {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(0, 193, 106, 0.16);
  background:
    radial-gradient(circle at top right, rgba(0, 193, 106, 0.14), transparent 26%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(233, 250, 242, 0.9));
  box-shadow: 0 18px 40px rgba(0, 88, 48, 0.11);
  padding: 20px;
}

.card::after {
  content: "";
  position: absolute;
  inset: auto -10% -54% auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0, 193, 106, 0.18), transparent 68%);
  pointer-events: none;
}

.hero-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.card-label {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f5f47;
}

.hero-chip {
  border-radius: 999px;
  background: rgba(0, 193, 106, 0.12);
  color: #0d7a44;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
}

.hero-value {
  position: relative;
  z-index: 1;
  margin: 14px 0 0;
  font-size: clamp(38px, 6vw, 56px);
  line-height: 1.1;
  font-weight: 700;
  color: #08311d;
}

.hero-meta {
  position: relative;
  z-index: 1;
  margin: 10px 0 0;
  font-size: 13px;
  color: #4d6b5c;
}
</style>
