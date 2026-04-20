# ylscode-win MVP Design

## Summary

构建一个基于 `Electron + Vite + Vue 3 + @nuxt/ui` 的 Windows 桌面小挂件应用，用于展示 YLS Codex 额度信息。首个 MVP 聚焦单窗口桌面挂件，不做托盘/任务栏常驻形态，但在架构上保留后续扩展空间。

应用需要支持：

- 应用内录入并本地保存 `token`
- 自动轮询接口，默认 `60s`
- 手动刷新
- 窗口置顶并保存状态
- 展示剩余额度、当前额度、本周额度、账号邮箱、套餐总额度、套餐到期时间
- 使用进度条呈现额度消耗情况

## Goals

- 快速提供一个可运行的桌面挂件 MVP
- 保持接口解析与参考仓库 `mdddj/yls-yy-app` 的字段逻辑一致
- 将 Electron 专属逻辑与前端 UI 解耦，方便后续扩展托盘/任务栏版本

## Non-Goals

- 不实现托盘或任务栏常驻展示
- 不实现多窗口
- 不实现账号系统或服务端代理
- 不实现 token 加密存储之外的企业级安全方案
- 不对“每日额度”做超出接口字段的推断展示

## Technical Choice

采用 `Electron + Vite + Vue 3 + @nuxt/ui`。

选择理由：

- 当前目标是桌面挂件式单窗口应用，不需要 Nuxt 的 SSR、Nitro 和约定式路由能力
- `@nuxt/ui` 可直接用于 Vue + Vite 项目，能够满足卡片、表单、按钮、进度条等界面需求
- Electron 主进程、预加载层与渲染层边界更清晰，后续扩展托盘/任务栏版本时复用成本更低

## Reference API

- Endpoint: `GET https://codex.ylsagi.com/codex/info`
- Header: `Authorization: Bearer <token>`

参考仓库中的核心字段：

- `state.remaining_quota`
- `state.user.email`
- `state.userPackgeUsage`
- `state.userPackgeUsage_week`
- `state.package.total_quota`
- `state.package.weeklyQuota`
- `state.package.packages[]`

## Data Semantics

所有额度值统一按美元展示，文案明确标注 `USD`。不将额度解释为 token 数量。

文案口径：

- `剩余额度 (USD)`
- `当前额度 (USD)`
- `本周额度 (USD)`
- `套餐总额度 (USD)`

数字格式：

- 默认格式为 `$12,340` 或 `$12,340.56`
- 有小数时最多保留 2 位
- 无小数时不补 `.00`

## Field Mapping

### Main Metrics

- `剩余额度`
  - 优先：`state.remaining_quota`
  - 回退：`state.userPackgeUsage.remaining_quota`
  - 再回退：`state.userPackgeUsage_week.remaining_quota`

- `当前额度`
  - 来源：`state.userPackgeUsage`
  - 展示：`已用 / 总额` 与进度条
  - 计算：
    - `used_percentage` 存在则直接使用
    - 否则用 `(total_quota - remaining_quota) / total_quota`

- `本周额度`
  - 来源：`state.userPackgeUsage_week`
  - 展示：`已用 / 总额` 与进度条
  - 若字段缺失，则整体显示 `--`

### Supporting Information

- `账号邮箱`
  - 来源：`state.user.email`

- `套餐总额度`
  - 来源：`state.package.total_quota`

- `套餐到期时间`
  - 来源：`state.package.packages[]`
  - 规则：
    - 先筛选有效套餐
    - 优先取当前仍处于有效期、且最近到期的套餐
    - 若没有明确 active 项，则在可解析日期的套餐中选最近到期项

## UI Design

### Window Form

- Windows 桌面小挂件窗口
- 默认尺寸约 `420 x 520`
- 允许缩放，但设置最小尺寸
- 支持拖动并记住上次位置和大小
- 支持窗口置顶

窗口形态选择“轻量卡片窗”，而非完全无边框极简块，以保证 Windows 上的交互稳定性与可调试性。

### Layout

顶部操作区：

- 应用标题
- `置顶` 开关
- `刷新` 按钮

主体主指标区：

- 大号展示 `剩余额度 (USD)`

额度卡片区：

- `当前额度 (USD)` 卡片
- `本周额度 (USD)` 卡片
- 每张卡片显示：
  - `已用 / 总额`
  - 百分比或进度值
  - 进度条

信息区：

- `账号邮箱`
- `套餐总额度 (USD)`
- `套餐到期时间`

设置区：

- `Token` 输入框
- `显示/隐藏 Token` 控件
- `保存 Token` 按钮
- `轮询间隔` 选择器

### Visual Direction

- 风格偏桌面挂件，不做传统管理后台
- 使用浅色玻璃卡片、明显的数字层级与进度条
- 保持界面聚焦于主指标、两个进度卡与辅助信息三层层级

## Interaction Design

### Token

- 用户在应用内输入 token
- 保存后写入本机用户目录配置
- 重启应用后自动恢复
- 渲染层不直接持有 Node 权限，通过预加载接口调用存储逻辑

### Refresh

- 支持点击按钮立即刷新
- 切换 token 后立即刷新
- 切换轮询间隔后立即按新策略生效

### Polling

支持以下轮询间隔：

- `5s`
- `30s`
- `60s`
- `3min`
- `5min`
- `10min`

默认值为 `60s`。

### Always On Top

- 置顶状态在 UI 中可直接切换
- 切换后立即反映到窗口属性
- 状态本地持久化

## Application Structure

按三层拆分：

- `electron/`
  - `main.ts`
  - `preload.ts`
  - `ipc.ts`
  - `store.ts`
  - 负责窗口创建、IPC、持久化、轮询调度

- `src/`
  - `main.ts`
  - `App.vue`
  - `components/*.vue`
  - 负责 UI 与用户交互

- `shared/`
  - `types.ts`
  - `api.ts`
  - `mappers.ts`
  - 负责接口类型、字段映射、金额格式化、进度计算等纯函数

## Security Boundary

- 渲染层不直接使用 Node API
- Electron 使用 `preload` 暴露白名单 API
- token 不放入仓库，不写死在前端代码中
- token 不依赖浏览器 `localStorage` 作为主存储，而是通过 Electron 侧持久化

## Error Handling

### No Token

- 不发起接口请求
- 界面提示“请先配置 Token”
- 保留输入与保存操作

### Authentication Error

- 当接口返回鉴权失败或 401 类错误时：
  - 不清空整个界面结构
  - 顶部或状态区提示“Token 无效或已过期”

### Network Error

- 若曾成功拉取过数据，则保留上次成功数据
- 同时显示“刷新失败”提示

### Missing Weekly Data

- `本周额度` 卡片显示 `--`
- 其余信息继续正常展示

### Malformed Response

- 当返回结构缺少关键字段时显示友好错误信息
- 不允许界面崩溃

## Testing Strategy

MVP 阶段至少覆盖：

- 纯函数单元测试
  - 金额格式化
  - 进度计算
  - 字段映射与回退逻辑
  - 套餐到期选择逻辑

- 基础集成验证
  - 有 token 时能成功拉取并展示数据
  - 无 token / 错误 token / 缺字段 / 周数据缺失时界面不崩溃

- 手工验证
  - 置顶切换有效
  - 轮询间隔切换有效
  - 重启后配置保留

## MVP Acceptance Criteria

- 能启动一个 Windows 桌面小挂件窗口
- 应用内可输入并保存 token，重启后仍存在
- 能请求并解析 `https://codex.ylsagi.com/codex/info`
- 首屏稳定展示：
  - `剩余额度 (USD)`
  - `当前额度 (USD)` + 进度条
  - `本周额度 (USD)` + 进度条
  - `账号邮箱`
  - `套餐总额度 (USD)`
  - `套餐到期时间`
- 支持手动刷新
- 支持自动轮询，默认 `60s`
- 支持轮询选项切换并持久化
- 支持窗口置顶并持久化
- 接口异常、token 异常、缺字段时界面不崩
- 视觉上应表现为桌面挂件，而非普通后台列表页

## Future Extensions

- 托盘/任务栏版显示
- 更紧凑的无边框挂件模式
- 多账号切换
- 历史趋势和额度变化图表
