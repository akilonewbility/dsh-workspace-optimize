# dsh-workspace-optimize

为 DSH 左侧工作区会话列表补充 **收藏、颜色标签、优先级/排序操作、跨工作区移动、Windows 通知**。

宿主：DeepSeek Harness 0.2.x。本插件是本地 bundle（`dsh.bundle.patch`），Host 半 + 浏览器半同包。

## 功能

| 功能 | 入口 | 说明 |
| --- | --- | --- |
| 收藏 | 会话行悬停星标、`...` 菜单「收藏会话」 | 已安装 Archive Manager 时复用它的收藏（两处星标一致），否则由本插件保存 |
| 颜色标签 | 悬停卡、`...` 菜单「设置颜色…」 | 9 色调色板，行前色点常驻（空闲状态时） |
| 排序与置顶 | `...` 菜单「排序与置顶…」 | 置顶/取消置顶走宿主能力；上移/下移/移到最前/移到最后写入宿主排序序列 |
| 跨工作区移动 | `...` 菜单「移动到工作区…」 | 复用 Archive Manager 的物理搬迁能力（带备份与回滚） |
| 通知 | 设置页 / 会话行外的全局层 | 会话完成、等待确认、出错、开始运行时发 Windows 通知，点击跳转到会话 |
| 设置 | 「设置 → 工作区增强」或 `...` 菜单「工作区增强」 | 通知类型、免打扰时段、通知权限、数据位置 |

## 安装

已经通过 `plugin_manager install_bundle` 安装到当前 profile。从源码重装：

```
plugin_manager install_bundle target=D:\dsh-plugins\dsh-workspace-optimize
```

或：

```powershell
dsh plugin --profile desktop add D:\dsh-plugins\dsh-workspace-optimize
```

安装后需要**重启 DSH**：Host 半（`index.js`、`lib/`）走模块缓存，只有重启才会加载新代码；浏览器半（`client.js`）刷新页面即可。重启后 Host 会把注册结果写到 profile 目录的 `workspace-optimize-diag.json`，可用来确认 `/api` 路由是否注册成功。

## 依赖与降级

- **Archive Manager（可选但推荐）**：提供收藏共享与跨工作区移动。缺失时收藏改存本插件，移动入口置灰并提示。
- **宿主 `webServer`**：缺失时插件不激活（Host 半硬依赖）。
- **通知权限**：桌面模式（Electron）通常已授权；浏览器模式首次通知时会请求一次权限，被拒则降级为页面内提示。

## 数据文件

`%USERPROFILE%\.dsh\workspace-optimize-state.json`（Host 进程设了 `DSH_PROFILE_DIR` 时落在该 profile 目录；诊断文件 `workspace-optimize-diag.json` 与之同目录）。

内容：颜色、优先级、设置、自建收藏。纯 JSON，可直接备份、删除（删除后回到默认状态）。

## 已知限制

1. **排序位置只在「手动」排序模式下可见**。DSH 的「最近更新」模式严格按最近用户消息时间排；菜单里的上移/下移不会改变该模式下的显示顺序。操作成功后也会提示这一点。
2. **颜色不是整行背景**。行前单元格（16px）在会话空闲时显示色点；运行中、等待交互、已归档的会话该格由宿主状态点或空白占据。
3. **跨工作区移动有约束**：运行中的会话、子代理会话、目标位置已存在同名日志会被拒绝；移动会改写会话的工作目录。
4. **页面关闭后收不到通知**。通知依赖页面进程；Host 不代发系统通知。
5. **复用 Archive Manager 的收藏/移动属于版本耦合**，通过能力探测降级；Archive Manager 升级若改变方法签名，收藏会回落到本插件存储，移动会提示不可用。
6. 收藏星标在悬停按钮与菜单里；`leading` 座位只在空闲行显示，因此运行中/归档会话的收藏状态只在悬停卡与菜单中可见。

## 目录

```
index.js          Host 半入口
lib/state.js      状态读写与校验
lib/adapters.js   收藏/移动/置顶/排序目标适配
lib/events.js     宿主会话事件采集
lib/api.js        HTTP 接口与 SSE
client.js         浏览器半（插槽、弹层、通知）
docs/RESEARCH.md  调研记录
```
