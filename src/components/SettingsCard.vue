<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  token: string
  pollingMs: number
  intervalOptions: readonly number[]
  busy?: boolean
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
    <div class="card-head">
      <h2>设置</h2>
      <span class="chip">控制</span>
    </div>
    <div class="field">
      <label for="token-input">令牌</label>
      <div class="token-row">
        <UInput
          id="token-input"
          v-model="draftToken"
          :type="showToken ? 'text' : 'password'"
          placeholder="请输入令牌"
          :disabled="busy"
          class="token-input"
        />
        <UButton
          color="neutral"
          variant="soft"
          :disabled="busy"
          @click="showToken = !showToken"
        >
          {{ showToken ? '隐藏' : '显示' }}
        </UButton>
      </div>
    </div>

    <div class="field">
      <label for="polling-select">轮询间隔</label>
      <div class="controls-row">
        <select
          id="polling-select"
          class="field-control"
          :value="pollingMs"
          :disabled="busy"
          @change="onChangeInterval"
        >
          <option v-for="item in intervalItems" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <UButton
          :loading="busy"
          :disabled="busy"
          class="field-control save-button justify-center text-center"
          @click="onSaveToken"
        >
          保存令牌
        </UButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card {
  --field-control-height: 46px;
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

.field {
  display: grid;
  gap: 6px;
  margin-top: 14px;
}

label {
  font-size: 12px;
  font-weight: 600;
  color: #5a7a68;
}

.token-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.token-input {
  width: 100%;
}

.token-input :deep([data-slot='base']) {
  min-height: var(--field-control-height);
  box-sizing: border-box;
  border-radius: 12px;
  padding-top: 11px;
  padding-bottom: 11px;
}

.controls-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: stretch;
}

.field-control {
  min-height: var(--field-control-height);
  box-sizing: border-box;
}

select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(0, 193, 106, 0.2);
  padding: 11px 12px;
  background: #fff;
  color: #123222;
  font: inherit;
}

.save-button {
  height: var(--field-control-height);
  min-width: 148px;
  display: inline-flex;
  justify-content: center !important;
  align-items: center;
  text-align: center;
  padding-inline: 0;
  line-height: 1;
  align-self: stretch;
}

@media (max-width: 700px) {
  .controls-row {
    grid-template-columns: 1fr;
  }

  .save-button {
    width: 100%;
  }
}
</style>
