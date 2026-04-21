# ylscode-win Today Usage Card Design

## Summary

在现有配额桌面组件中新增一个“今日明细”卡片，展示当前订阅今日维度的非金额使用指标。数据继续来自现有接口 `GET /codex/info`，不引入新接口，不修改当前鉴权方式。

本次设计明确不接入趋势图。原因是候选趋势接口 `/apiV1/user/usage/trend?granularity=hour` 在当前本地 token 下返回 `401`，无法作为稳定 MVP 依赖。

## Goals

- 在不改变现有接口调用链的前提下，补充今日 token / request 维度明细
- 避免与现有“当前额度”卡片里的金额信息重复
- 保持界面信息层级清晰，新增卡片后不破坏现有布局
- 对缺字段和空值保持容错，不因后端字段波动导致界面崩溃

## Non-Goals

- 不接入趋势图
- 不接入第二个接口
- 不展示“今日花费”，因为当前额度卡片已经体现额度消耗
- 不新增复杂筛选、切换或多视图交互

## API Scope

继续使用现有接口：

- `GET https://codex.ylsagi.com/codex/info`

关注字段：

- `state.userPackgeUsage.request_count`
- `state.userPackgeUsage.input_tokens`
- `state.userPackgeUsage.input_tokens_cached`
- `state.userPackgeUsage.output_tokens`

若 `state.userPackgeUsage` 缺失，则整张卡片退化为占位展示。

## Data Model Changes

在共享模型中新增 `TodayUsageSnapshot`：

- `requestCount: number | null`
- `inputTokens: number | null`
- `cachedInputTokens: number | null`
- `outputTokens: number | null`

在 `DashboardSnapshot` 中新增：

- `todayUsage: TodayUsageSnapshot | null`

映射规则：

- 仅做数字归一化，不在 mapper 中做格式化
- `null`、空字符串、不可解析值统一映射为 `null`
- 不将任何字段自动兜底为 `0`，避免把“缺数据”误显示成“真实为零”

## UI Design

新增一个独立组件：`TodayUsageCard.vue`

卡片标题：

- `今日明细`

卡片内容为四个指标块：

- 请求次数
- 输入 Token
- 缓存 Token
- 输出 Token

布局要求：

- 桌面宽度下为四列紧凑信息块
- 窄宽度下自动换为两列或一列
- 保持与现有卡片一致的视觉风格：浅色面板、圆角、轻边框、清晰数字层级

卡片放置位置：

- 位于两张额度卡片下方
- 位于设置卡片上方

这样可以形成“额度概览 -> 今日明细 -> 设置”的阅读顺序。

## Formatting Rules

请求次数：

- 显示整数
- 缺值显示 `--`

Token 数值：

- 使用紧凑格式
- 示例：`54.3K`、`3.2M`
- 小于 1000 时显示原始整数
- 缺值显示 `--`

本次不在该卡片中显示金额、百分比、进度条或图表。

## Error Handling

当 `state.userPackgeUsage` 不存在时：

- 仍渲染“今日明细”卡片
- 四个字段都显示 `--`
- 不影响现有额度卡、设置卡、顶部摘要

当单个字段缺失时：

- 仅该字段显示 `--`
- 其他字段照常展示

## Component and Code Boundaries

修改范围：

- `shared/types.ts`
- `shared/mappers.ts`
- `shared/formatters.ts`
- `src/components/TodayUsageCard.vue`
- `src/App.vue`
- 对应测试文件

职责分工：

- `shared/types.ts`：定义今日明细结构
- `shared/mappers.ts`：从 API payload 映射出 `todayUsage`
- `shared/formatters.ts`：新增 token 紧凑格式化函数
- `TodayUsageCard.vue`：纯展示组件
- `App.vue`：组合布局并向卡片传值

## Testing Strategy

至少覆盖以下验证：

1. mapper 测试
- 能从 `state.userPackgeUsage` 正确提取四个字段
- 缺字段时返回 `null`

2. formatter 测试
- `K / M` 紧凑格式输出符合预期
- `null` / `undefined` / `NaN` 返回 `--`

3. UI 测试
- App 能渲染“今日明细”卡片
- 四个值能按预期显示
- 缺字段时不崩溃，显示 `--`

## Acceptance Criteria

- 页面新增“今日明细”卡片
- 卡片展示请求次数、输入 Token、缓存 Token、输出 Token 四项
- 数据全部来自现有 `/codex/info`
- 不增加新的网络请求
- 不展示重复金额信息
- 缺字段时卡片不报错，显示占位值
