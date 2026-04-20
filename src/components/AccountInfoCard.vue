<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatUsd } from '../../shared/formatters.js'

const props = defineProps<{
  email: string | null
  packageTotalUsd: number | null
  packageExpiresAt: string | null
}>()

const emailText = computed(() => props.email || '--')
const packageTotalText = computed(() => formatUsd(props.packageTotalUsd))
const packageExpireText = computed(() => formatDate(props.packageExpiresAt))
</script>

<template>
  <section class="card">
    <div class="card-head">
      <h2>账户信息</h2>
      <span class="chip">账户</span>
    </div>
    <dl class="meta-grid">
      <div class="meta-item">
        <dt>账号邮箱</dt>
        <dd>{{ emailText }}</dd>
      </div>
      <div class="meta-item">
        <dt>套餐总额度 (USD)</dt>
        <dd>{{ packageTotalText }}</dd>
      </div>
      <div class="meta-item">
        <dt>套餐到期时间</dt>
        <dd>{{ packageExpireText }}</dd>
      </div>
    </dl>
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

.meta-grid {
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meta-item {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 193, 106, 0.1);
  padding: 12px;
}

dt {
  font-size: 12px;
  color: #5a7a68;
  margin-bottom: 8px;
}

dd {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #123222;
}

@media (max-width: 700px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
