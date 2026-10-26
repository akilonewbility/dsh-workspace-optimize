# 左侧工作区增强插件 · 调研记录

调研时间：2026-10-26。宿主：DSH 0.2.1-rc（Desktop profile `desktop`，Web GUI `http://127.0.0.1:54110`）。

## 1. 结论速览

需求里有一部分宿主已经内建，插件不应重复实现：

| 需求 | 现状 | 证据 | 新插件的做法 |
| --- | --- | --- | --- |
| 置顶 | 官方已内建 | `sidebar.workspaces.session.menu.item` 有官方 `pin`(order 100)，`session.row.action` 有 `pin`(order 200)；Host `workspaceRegistry.pinSession/unpinSession`，持久化 `pinnedSessionIds`（最近置顶在前） | 复用，只做入口聚合与「置顶分区内移前」 |
| 手动排序 | 官方已内建 | 视图选项有「最近更新 / 手动」；`workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId)` | 提供上移/下移/移到最前/移到最后；提示仅在「手动」模式可见 |
| 收藏 | 官方无 | `@michengai/dsh-archive-manager@1.1.16` 已实现，暴露 `workspaceRegistry.favoriteSessions/setSessionFavorite` | 优先复用它的收藏，保持两处星标一致；缺失时自建 |
| 跨工作区移动 | 官方无 API | 会话归属由 `SessionHeader.cwd` 决定（`@deepseek-ai/dsh-workspace` README「Grouping sessions under a project」）；archive-manager 的 `moveSessionToWorkspace` 做物理搬迁 + 回滚 | 复用该实现；不可用则禁用并提示 |
| 颜色 | 官方无 | 插槽 `sidebar.session.row.leading` 提供 16px 行前装饰位 | 自建持久化 + 色点 |
| 通知 | 官方无 | `dsh-pet` 客户端已使用 `new Notification()` / `Notification.requestPermission()` | Host 采集事件，Client 弹 Windows 通知 |

**不替换 `sidebar.workspaces`**：它是 `kind: single`、`replaceRisk: shadows-shipped-ui`，替换会丢掉官方搜索、拖拽、树形分组、归档过滤、hover 卡与行动画。

## 2. 可用扩展点（已核实）

- `sidebar.workspaces.session.menu.item`：会话行 `...` 菜单项，`id` + `order`，owner props 为 `{ sessionId, displayTitle }`，可注入 `useMenuOpenState`。
- `sidebar.workspaces.session.row.action`：行尾 hover 按钮，owner props 同上；官方已占 `archive`(100)、`pin`(200)。
- `sidebar.session.row.leading`：行前 16px 装饰位，仅当局状态为 idle 时渲染，已归档行空白。
- `sidebar.session.row.hover`：hover 卡片段，仅在卡片打开时挂载。
- `shell.overlay`：全框浮动层，点击穿透，条目自行开启 `pointer-events`。
- `settings.section`：设置页整页入口。

## 3. 数据通道

- Host 半可注册 HTTP 路由：`ctx.webServer.register({ kind: 'exact' | 'prefix', path, handler })`（`WebRoute`，Node `http` 语义）。
- 先例：archive-manager 用同源校验 + JSON 路由；dsh-pet 同样注册路由。
- Client 半在浏览器里 `fetch` 相对路径即可；反代场景需按 `document.baseURI` 解析（archive-manager 的 `resolveApiUrl`）。
- 通知及时性：隐藏标签页的 `setInterval` 会被节流，因此主通道用 SSE（`EventSource` 保持网络活动），轮询作为回退。

## 4. 持久化

- 插件自有数据（颜色、优先级、设置、自建收藏）用 Host 侧 JSON 文件，路径 `<DSH_PROFILE_DIR>/workspace-optimize-state.json`，回退 `~/.dsh/`。
- 理由：零额外依赖、可直接导出/备份；存储域（`storageDomain`）需要 import 官方包并构造 DomainSpec，版本耦合更大。
- 先例：archive-manager 在 `lib/session-move.js` 中直接用 `node:fs`，证明 Host 半可用原生文件 API。

## 5. 已知限制（写入 README 与设置页）

1. 会话排序的显示位置只在「手动」排序模式下受控；「最近更新」模式严格按最近用户消息时间排。
2. 整行背景着色不可行；颜色只体现为行前色点与悬停卡/菜单文本。
3. `leading` 座位在会话运行中不渲染，归档行为空白。
4. 跨工作区移动会移动会话日志文件并改写工作目录；运行中会话、子代理会话、目标同名日志会被拒绝。
5. 浏览器模式下页面完全关闭后收不到通知（通知随之停止）。
6. 复用 archive-manager 的收藏/移动属于版本耦合，需要通过能力探测并降级。
