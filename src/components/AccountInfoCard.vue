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
    <h2>账户信息</h2>
    <dl class="meta-grid">
      <div>
        <dt>账号邮箱</dt>
        <dd>{{ emailText }}</dd>
      </div>
      <div>
        <dt>套餐总额度 (USD)</dt>
        <dd>{{ packageTotalText }}</dd>
      </div>
      <div>
        <dt>套餐到期时间</dt>
        <dd>{{ packageExpireText }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.card {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(255, 255, 255, 0.84);
  padding: 14px;
}

h2 {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
}

.meta-grid {
  margin: 12px 0 0;
  display: grid;
  gap: 10px;
}

dt {
  font-size: 12px;
  color: #64748b;
}

dd {
  margin: 4px 0 0;
  font-size: 14px;
  color: #0f172a;
}
</style>
