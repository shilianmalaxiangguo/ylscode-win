<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  token: string
  pollingMs: number
  intervalOptions: readonly number[]
  loading?: boolean
}>()

const emit = defineEmits<{
  saveToken: [token: string]
  changeInterval: [pollingMs: number]
}>()

const showToken = ref(false)
const draftToken = ref(props.token)

watch(
  () => props.token,
  (value) => {
    draftToken.value = value
  }
)

const intervalItems = computed(() =>
  props.intervalOptions.map((value) => ({ value, label: formatPollingLabel(value) }))
)

const onSaveToken = () => {
  emit('saveToken', draftToken.value)
}

const onChangeInterval = (event: Event) => {
  const value = Number((event.target as HTMLSelectElement).value)
  emit('changeInterval', value)
}

function formatPollingLabel(ms: number): string {
  if (ms <= 60000) {
    return `${ms / 1000}s`
  }
  if (ms % 60000 === 0) {
    return `${ms / 60000}min`
  }
  return `${ms}ms`
}
</script>

<template>
  <section class="card">
    <h2>设置</h2>
    <div class="field">
      <label for="token-input">Token</label>
      <div class="token-row">
        <UInput
          id="token-input"
          v-model="draftToken"
          :type="showToken ? 'text' : 'password'"
          placeholder="请输入 Token"
          :disabled="loading"
          class="token-input"
        />
        <UButton
          color="neutral"
          variant="soft"
          :disabled="loading"
          @click="showToken = !showToken"
        >
          {{ showToken ? '隐藏' : '显示' }}
        </UButton>
      </div>
    </div>

    <div class="field">
      <label for="polling-select">轮询间隔</label>
      <select id="polling-select" :value="pollingMs" :disabled="loading" @change="onChangeInterval">
        <option v-for="item in intervalItems" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </div>

    <UButton :loading="loading" block @click="onSaveToken">保存 Token</UButton>
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

.field {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

label {
  font-size: 12px;
  color: #64748b;
}

.token-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.token-input {
  width: 100%;
}

select {
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  padding: 8px 10px;
  background: #fff;
  color: #0f172a;
}
</style>
