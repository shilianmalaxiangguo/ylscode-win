<template>
  <UApp>
    <main class="app-shell">
      <h1>YLS Code</h1>
      <p class="label">剩余额度 (USD)</p>
      <p class="hint">请先配置 Token</p>
    </main>
  </UApp>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  text-align: center;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.label {
  font-size: 0.95rem;
  opacity: 0.85;
}

.hint {
  font-size: 0.9rem;
  opacity: 0.75;
}
</style>
