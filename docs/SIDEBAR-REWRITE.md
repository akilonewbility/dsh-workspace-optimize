# 实验分支：自绘侧栏（B）

分支：`experiment/sidebar-rewrite`（基线 `main` 为官方侧栏版本）。

## 为什么替换 `sidebar.workspaces`

工作区文件夹行（rename/delete 那个 `...`）在 ui-workspace 内部硬编码，没有对外插槽；要让收藏/颜色/菜单作用到工作区文件夹，只能替换整个 `sidebar.workspaces`（`single`，`shadows-shipped-ui`）。

## 数据来源

不依赖 ui-workspace 的 Client 私有快照，改由 Host 组装稳定 JSON（`lib/sidebar.js` → `GET /api/workspace-optimize/sidebar`）：

| 字段 | 来源 |
| --- | --- |
| 工作区与顺序 | `workspaceRegistry.list()` 的 `sessionIds` |
| 归档/置顶集合 | `workspaceController.follow()` 首帧（完整 baseline，2s 超时） |
| 标题/时间/cwd | `sessionQuery.listSessions()`，live 会话回退 `sessionTitle.get()` |
| 运行状态 | `agents.get(id).status`，回退 live session 状态 |

所有字段缺失都退化为空值，不阻断渲染。

## 已实现

- 工作区分组 + 折叠（本地持久）
- 工作区头：颜色、收藏、会话数、`...` 菜单（收藏/颜色/新建会话/重命名）
- 会话行：状态点、颜色点、标题、相对时间、星标、`...` 菜单
- 会话菜单：收藏、颜色、重命名、置顶/取消置顶、复制 ID、移动到工作区（需 Archive Manager）、置顶/上移/下移/置底、归档/恢复
- 视图选项：分组方式（平铺 / 工作区树）、排序（最近更新 / 手动）、归档过滤（隐藏/全部/仅归档）
- 标题搜索（本地过滤）
- 拖拽排序：写入 `workspaces.insertSessionBefore` 并切到手动顺序
- 新建会话、添加工作区（`uiWorkspace.pickDirectory` + `workspaces.create`）
- 侧栏折叠态（rail）
- 模式开关：设置 → 工作区增强 → 侧栏样式（增强侧栏 / 官方侧栏），切回官方即释放插槽

## 尚未追平官方

- 正文搜索（官方走 Host 内容索引）
- 会话 hover 卡（目前用 `title` 提示）
- 行动画（进入/离开/排序动画）
- 行级子插槽（`sidebar.workspaces.session.*` 不再声明，Archive Manager / Schedule 的行级入口在此模式下不显示；其设置页入口仍在）
- 归档过滤与"显示更多"水位（当前一次渲染全部可见会话）

## 回退

- 设置里切「官方侧栏」：立即释放 `sidebar.workspaces`，官方浏览器恢复，无需重启。
- 代码级回退：`git checkout main` 后重启。
