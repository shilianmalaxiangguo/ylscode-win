# Today Usage Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "today usage" card that shows request count, input tokens, cached input tokens, and output tokens from the existing `/codex/info` response.

**Architecture:** Extend the shared dashboard snapshot with a `todayUsage` view-model, map the four fields out of `state.userPackgeUsage`, add compact token formatting helpers, and render a dedicated `TodayUsageCard` between the quota cards and settings card. Implementation stays on the existing single-endpoint fetch path.

**Tech Stack:** Vue 3, Electron, TypeScript, Vitest, Vue Test Utils

---

## File Map

- `D:\workSotre\ylscode-win\shared\types.ts`
  - Add `TodayUsageSnapshot` and extend `UsagePayload`/`DashboardSnapshot`.
- `D:\workSotre\ylscode-win\shared\mappers.ts`
  - Map `request_count`, `input_tokens`, `input_tokens_cached`, `output_tokens`.
- `D:\workSotre\ylscode-win\shared\formatters.ts`
  - Add compact token formatter and integer formatter.
- `D:\workSotre\ylscode-win\shared\__tests__\mappers.spec.ts`
  - Cover today usage mapping and null fallback behavior.
- `D:\workSotre\ylscode-win\shared\__tests__\formatters.spec.ts`
  - Cover compact token formatting and placeholder behavior.
- `D:\workSotre\ylscode-win\src\components\TodayUsageCard.vue`
  - New presentational card for four metrics.
- `D:\workSotre\ylscode-win\src\App.vue`
  - Render the new card in the main layout.
- `D:\workSotre\ylscode-win\src\App.spec.ts`
  - Cover card rendering and formatted values.
- `D:\workSotre\ylscode-win\src\composables\useDashboard.ts`
  - Extend preview snapshot to include `todayUsage`.

### Task 1: Add failing shared-model tests

**Files:**
- Modify: `D:\workSotre\ylscode-win\shared\__tests__\mappers.spec.ts`
- Modify: `D:\workSotre\ylscode-win\shared\__tests__\formatters.spec.ts`

- [ ] **Step 1: Write failing mapper expectations for today usage**

```ts
expect(mapApiEnvelopeToDashboardSnapshot(envelope, referenceTimeMs)).toEqual({
  // existing fields...
  todayUsage: {
    requestCount: 128,
    inputTokens: 3214567,
    cachedInputTokens: 2987654,
    outputTokens: 54321
  }
})
```

- [ ] **Step 2: Write failing formatter tests**

```ts
expect(formatCompactCount(54321)).toBe('54.3K')
expect(formatCompactCount(3214567)).toBe('3.2M')
expect(formatCompactCount(2987654)).toBe('3M')
expect(formatInteger(2085)).toBe('2,085')
expect(formatCompactCount(null)).toBe('--')
```

- [ ] **Step 3: Run shared tests to verify RED**

Run: `npm test -- shared/__tests__/mappers.spec.ts shared/__tests__/formatters.spec.ts`
Expected: FAIL because `todayUsage`, `formatCompactCount`, and `formatInteger` do not exist yet.

### Task 2: Implement shared mapping and formatting

**Files:**
- Modify: `D:\workSotre\ylscode-win\shared\types.ts`
- Modify: `D:\workSotre\ylscode-win\shared\mappers.ts`
- Modify: `D:\workSotre\ylscode-win\shared\formatters.ts`

- [ ] **Step 1: Extend shared types with today usage fields**

```ts
export interface TodayUsageSnapshot {
  requestCount: number | null
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
}
```

- [ ] **Step 2: Map `state.userPackgeUsage` into `todayUsage`**

```ts
const toTodayUsageSnapshot = (usage: UsagePayload | null | undefined): TodayUsageSnapshot | null => ({
  requestCount: toNumber(usage?.request_count),
  inputTokens: toNumber(usage?.input_tokens),
  cachedInputTokens: toNumber(usage?.input_tokens_cached),
  outputTokens: toNumber(usage?.output_tokens)
})
```

- [ ] **Step 3: Add compact token and integer formatters**

```ts
export const formatCompactCount = (value: number | null | undefined): string => { /* ... */ }
export const formatInteger = (value: number | null | undefined): string => { /* ... */ }
```

- [ ] **Step 4: Run shared tests to verify GREEN**

Run: `npm test -- shared/__tests__/mappers.spec.ts shared/__tests__/formatters.spec.ts`
Expected: PASS

### Task 3: Add the card component and wire the layout

**Files:**
- Create: `D:\workSotre\ylscode-win\src\components\TodayUsageCard.vue`
- Modify: `D:\workSotre\ylscode-win\src\App.vue`
- Modify: `D:\workSotre\ylscode-win\src\composables\useDashboard.ts`

- [ ] **Step 1: Write the failing App rendering test**

```ts
expect(wrapper.text()).toContain('今日明细')
expect(wrapper.text()).toContain('请求次数')
expect(wrapper.text()).toContain('3.2M')
expect(wrapper.text()).toContain('54.3K')
```

- [ ] **Step 2: Run App test to verify RED**

Run: `npm test -- src/App.spec.ts`
Expected: FAIL because the card is not rendered yet.

- [ ] **Step 3: Create `TodayUsageCard.vue` and render it from `App.vue`**

```vue
<TodayUsageCard :usage="dashboard.snapshot.value?.todayUsage ?? null" />
```

- [ ] **Step 4: Add preview data for `todayUsage`**

```ts
todayUsage: {
  requestCount: 128,
  inputTokens: 3214567,
  cachedInputTokens: 2987654,
  outputTokens: 54321
}
```

- [ ] **Step 5: Run App test to verify GREEN**

Run: `npm test -- src/App.spec.ts`
Expected: PASS

### Task 4: Full verification

**Files:**
- Modify: none

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts shared/mappers.ts shared/formatters.ts shared/__tests__/mappers.spec.ts shared/__tests__/formatters.spec.ts src/components/TodayUsageCard.vue src/App.vue src/App.spec.ts src/composables/useDashboard.ts docs/superpowers/plans/2026-04-21-ylscode-win-today-usage-card.md
git commit -m "feat: add today usage card"
```
