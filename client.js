/**
 * dsh-workspace-optimize · 浏览器半
 *
 * 通过 Module Loader 加载，向宿主的会话行插槽注册菜单项、悬停按钮、行前标记，
 * 并用 shell.overlay 自绘色板/排序/移动/设置弹层；通知走 Windows 通知中心。
 */
window.__ModuleLoader__.load({
  id: 'dsh-workspace-optimize',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const API_PREFIX = '/api/workspace-optimize/'
    const COLORS = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink', 'gray']
    const COLOR_HEX = {
      red: '#f87171',
      orange: '#fb923c',
      amber: '#fbbf24',
      green: '#34d399',
      teal: '#2dd4bf',
      blue: '#60a5fa',
      purple: '#a78bfa',
      pink: '#f472b6',
      gray: '#9ca3af',
    }

    const DICT = {
      zh: {
        'fav.add': '收藏会话',
        'fav.remove': '取消收藏',
        'fav.label': '收藏',
        'color.menu': '设置颜色…',
        'color.title': '设置颜色',
        'color.clear': '清除颜色',
        'order.menu': '排序与置顶…',
        'order.title': '排序与置顶',
        'order.pin': '置顶',
        'order.unpin': '取消置顶',
        'order.top': '移到最前',
        'order.up': '上移一位',
        'order.down': '下移一位',
        'order.bottom': '移到最后',
        'order.clear': '清除优先级',
        'order.hint': '位置变化需要在「视图选项 → 排序」中选择「手动」才可见；「最近更新」模式始终按时间排。',
        'move.menu': '移动到工作区…',
        'move.title': '移动到工作区',
        'move.empty': '没有可用的目标工作区',
        'move.warning': '移动会搬迁会话日志并改写其工作目录。运行中的会话、子代理会话、目标已存在同名日志时会被拒绝。',
        'move.confirm': '移动',
        'settings.title': '工作区增强',
        'settings.enabled': '启用插件',
        'settings.notify.complete': '会话完成时通知',
        'settings.notify.waiting': '等待你确认时通知',
        'settings.notify.error': '会话出错时通知',
        'settings.notify.started': '会话开始运行时通知',
        'settings.notifyWhenVisible': '窗口可见时也通知',
        'settings.dnd': '免打扰时段',
        'settings.dndStart': '开始',
        'settings.dndEnd': '结束',
        'settings.permission': '通知权限',
        'settings.permission.granted': '已允许',
        'settings.permission.denied': '已拒绝，请在系统或浏览器设置中允许通知',
        'settings.permission.default': '尚未授权',
        'settings.permission.request': '允许通知',
        'settings.favoritesSource.archive': '收藏来自 Archive Manager，两处星标一致',
        'settings.favoritesSource.local': '收藏由本插件保存',
        'settings.stateFile': '数据文件',
        'settings.moveUnavailable': '未检测到跨工作区移动能力（需要 Archive Manager）',
        'settings.unavailable': '宿主接口不可用，当前只能展示已有状态',
        'settings.maintenance': '维护',
        'settings.refreshSidebar': '刷新侧栏数据',
        'settings.reloadUi': '重新加载界面',
        'settings.reloadNew': '发现新界面版本，点击重载',
        'settings.clientRev': '界面版本',
        'settings.pageRev': '页面',
        'settings.hostRevLabel': 'Host',
        'settings.checkVersion': '检查版本',
        'settings.revUnknown': '未知',
        'settings.reloadFailed': '无法重载界面',
        'settings.reloadSameRev': '宿主还没有新的界面版本，重载不会生效；刚修改过插件请重启应用。',
        'settings.hostRestartHint': '重载界面只更新浏览器半侧（会丢失未发送的输入）；Host 代码更新需要重启应用。',
        'notify.complete': '会话已完成',
        'notify.waiting': '等待你的确认',
        'notify.error': '会话出错',
        'notify.started': '会话开始运行',
        'toast.saved': '已保存',
        'toast.failed': '操作失败',
        'toast.unchanged': '位置没有变化',
        'toast.orderDone': '已调整顺序；若看不到变化，请把排序切到「手动」',
        'toast.orderUnavailable': '无法调整顺序：会话不在任何工作区',
        'toast.noOrderApi': '宿主未提供排序接口',
        'toast.moveDone': '已移动到目标工作区',
        'toast.pinDone': '已置顶',
        'toast.unpinDone': '已取消置顶',
        'toast.permissionDenied': '通知权限被拒绝，将改为页面内提示',
        'common.close': '关闭',
        'common.cancel': '取消',
        'common.ok': '确定',
        'color.name.red': '红',
        'color.name.orange': '橙',
        'color.name.amber': '黄',
        'color.name.green': '绿',
        'color.name.teal': '青',
        'color.name.blue': '蓝',
        'color.name.purple': '紫',
        'color.name.pink': '粉',
        'color.name.gray': '灰',
        'priority.value': '优先级 {value}',
        'sidebar.title': '会话',
        'sidebar.newSession': '新建会话',
        'sidebar.addWorkspace': '添加工作区',
        'sidebar.addUnavailable': '当前环境不支持添加工作区',
        'sidebar.openFailed': '无法打开会话',
        'sidebar.archived': '已归档',
        'sidebar.copied': '已复制会话 ID',
        'sidebar.empty': '还没有会话',
        'sidebar.loading': '正在加载…',
        'sidebar.untitled': '未命名',
        'sidebar.search': '搜索会话',
        'sidebar.refresh': '刷新',
        'sidebar.rail': '展开侧栏',
        'sidebar.broken': '日志不可用',
        'sidebar.running': '运行中',
        'sidebar.pendingApproval': '等待审批',
        'sidebar.pendingPlan': '计划待审',
        'sidebar.pendingQuestion': '等待回答',
        'sidebar.done': '已完成',
        'favorites.title': '收藏',
        'favorites.sessions': '收藏的会话',
        'favorites.workspaces': '收藏的工作区',
        'favorites.empty': '还没有收藏',
        'sidebar.schedules': '{count} 个定时任务',
        'search.results': '正文命中',
        'view.options': '视图选项',
        'view.group.flat': '平铺分组',
        'view.group.tree': '工作区树',
        'view.order.updated': '最近更新',
        'view.order.manual': '手动',
        'view.filter.hide': '隐藏已归档',
        'view.filter.show': '全部会话',
        'view.filter.only': '仅已归档',
        'ws.favorite': '收藏工作区',
        'ws.unfavorite': '取消收藏工作区',
        'ws.newSession': '在此新建会话',
        'ws.rename': '重命名工作区',
        'ws.color': '工作区颜色…',
        'ws.renamePrompt': '新的工作区名称',
        'session.rename': '重命名会话',
        'session.renamePrompt': '新的会话标题',
        'session.pin': '置顶',
        'session.unpin': '取消置顶',
        'session.archive': '归档',
        'session.unarchive': '恢复',
        'session.copyId': '复制会话 ID',
        'session.deleteUnsupported': '官方不支持删除会话，请使用归档。',
        'session.menu': '更多操作',
        'session.archive': '归档会话',
        'session.unarchive': '恢复会话',
        'session.color': '设置颜色…',
        'session.move': '移动到工作区…',
        'settings.sidebarMode': '侧栏样式',
        'settings.sidebarMode.optimized': '增强侧栏',
        'settings.sidebarMode.native': '官方侧栏',
        'settings.showBlankSessions': '显示空白会话（便于清理）',
      },
      en: {
        'fav.add': 'Favorite session',
        'fav.remove': 'Remove favorite',
        'fav.label': 'Favorite',
        'color.menu': 'Set color…',
        'color.title': 'Set color',
        'color.clear': 'Clear color',
        'order.menu': 'Order and pin…',
        'order.title': 'Order and pin',
        'order.pin': 'Pin to top',
        'order.unpin': 'Unpin',
        'order.top': 'Move to first',
        'order.up': 'Move up',
        'order.down': 'Move down',
        'order.bottom': 'Move to last',
        'order.clear': 'Clear priority',
        'order.hint': 'Position changes are visible only in View options → Sort → Manual; Last updated always sorts by time.',
        'move.menu': 'Move to workspace…',
        'move.title': 'Move to workspace',
        'move.empty': 'No target workspace',
        'move.warning': 'Moving relocates the session log and rewrites its working directory. Running sessions, subagent sessions, and conflicting target logs are refused.',
        'move.confirm': 'Move',
        'settings.title': 'Workspace Optimize',
        'settings.enabled': 'Enable plugin',
        'settings.notify.complete': 'Notify when a session finishes',
        'settings.notify.waiting': 'Notify when it waits for you',
        'settings.notify.error': 'Notify when a session errors',
        'settings.notify.started': 'Notify when a session starts',
        'settings.notifyWhenVisible': 'Notify even while the window is visible',
        'settings.dnd': 'Do not disturb',
        'settings.dndStart': 'Start',
        'settings.dndEnd': 'End',
        'settings.permission': 'Notification permission',
        'settings.permission.granted': 'Granted',
        'settings.permission.denied': 'Denied by the system or browser',
        'settings.permission.default': 'Not requested yet',
        'settings.permission.request': 'Allow notifications',
        'settings.favoritesSource.archive': 'Favorites come from Archive Manager, so both star states match',
        'settings.favoritesSource.local': 'Favorites are stored by this plugin',
        'settings.stateFile': 'Data file',
        'settings.moveUnavailable': 'Cross-workspace move unavailable (requires Archive Manager)',
        'settings.unavailable': 'Host API unavailable; showing cached state only',
        'settings.maintenance': 'Maintenance',
        'settings.refreshSidebar': 'Refresh sidebar data',
        'settings.reloadUi': 'Reload interface',
        'settings.reloadNew': 'New interface version — click to reload',
        'settings.clientRev': 'Interface version',
        'settings.pageRev': 'Page',
        'settings.hostRevLabel': 'Host',
        'settings.checkVersion': 'Check',
        'settings.revUnknown': 'unknown',
        'settings.reloadFailed': 'Cannot reload the interface',
        'settings.reloadSameRev': 'The host has no new interface version yet; restart the app after changing the plugin.',
        'settings.hostRestartHint': 'Reloading updates only the browser half (unsent input is lost); Host changes require an app restart.',
        'notify.complete': 'Session finished',
        'notify.waiting': 'Waiting for your confirmation',
        'notify.error': 'Session error',
        'notify.started': 'Session started',
        'toast.saved': 'Saved',
        'toast.failed': 'Action failed',
        'toast.unchanged': 'Position unchanged',
        'toast.orderDone': 'Order updated; switch Sort to Manual if you do not see it',
        'toast.orderUnavailable': 'Cannot reorder: session is in no workspace',
        'toast.noOrderApi': 'The host exposes no ordering API',
        'toast.moveDone': 'Moved to the target workspace',
        'toast.pinDone': 'Pinned',
        'toast.unpinDone': 'Unpinned',
        'toast.permissionDenied': 'Notification permission denied; falling back to in-page toasts',
        'common.close': 'Close',
        'common.cancel': 'Cancel',
        'common.ok': 'OK',
        'color.name.red': 'Red',
        'color.name.orange': 'Orange',
        'color.name.amber': 'Amber',
        'color.name.green': 'Green',
        'color.name.teal': 'Teal',
        'color.name.blue': 'Blue',
        'color.name.purple': 'Purple',
        'color.name.pink': 'Pink',
        'color.name.gray': 'Gray',
        'priority.value': 'Priority {value}',
        'sidebar.title': 'Sessions',
        'sidebar.newSession': 'New session',
        'sidebar.addWorkspace': 'Add workspace',
        'sidebar.addUnavailable': 'Adding a workspace is unavailable here',
        'sidebar.openFailed': 'Cannot open the session',
        'sidebar.archived': 'Archived',
        'sidebar.copied': 'Session ID copied',
        'sidebar.empty': 'No sessions yet',
        'sidebar.loading': 'Loading…',
        'sidebar.untitled': 'Untitled',
        'sidebar.search': 'Search sessions',
        'sidebar.refresh': 'Refresh',
        'sidebar.rail': 'Expand sidebar',
        'sidebar.broken': 'log unavailable',
        'sidebar.running': 'Running',
        'sidebar.pendingApproval': 'Waiting for approval',
        'sidebar.pendingPlan': 'Plan awaiting review',
        'sidebar.pendingQuestion': 'Waiting for answer',
        'sidebar.done': 'Done',
        'favorites.title': 'Favorites',
        'favorites.sessions': 'Favorite sessions',
        'favorites.workspaces': 'Favorite workspaces',
        'favorites.empty': 'No favorites yet',
        'sidebar.schedules': '{count} scheduled task(s)',
        'search.results': 'Content matches',
        'view.options': 'View options',
        'view.group.flat': 'Flat groups',
        'view.group.tree': 'Workspace tree',
        'view.order.updated': 'Last updated',
        'view.order.manual': 'Manual',
        'view.filter.hide': 'Hide archived',
        'view.filter.show': 'All conversations',
        'view.filter.only': 'Archived only',
        'ws.favorite': 'Favorite workspace',
        'ws.unfavorite': 'Remove workspace favorite',
        'ws.newSession': 'New session here',
        'ws.rename': 'Rename workspace',
        'ws.color': 'Workspace color…',
        'ws.renamePrompt': 'New workspace name',
        'session.rename': 'Rename session',
        'session.renamePrompt': 'New session title',
        'session.pin': 'Pin',
        'session.unpin': 'Unpin',
        'session.archive': 'Archive',
        'session.unarchive': 'Unarchive',
        'session.copyId': 'Copy session ID',
        'session.deleteUnsupported': 'Session deletion is not supported; use archive instead.',
        'session.menu': 'More actions',
        'session.archive': 'Archive session',
        'session.unarchive': 'Restore session',
        'session.color': 'Set color…',
        'session.move': 'Move to workspace…',
        'settings.sidebarMode': 'Sidebar style',
        'settings.sidebarMode.optimized': 'Enhanced sidebar',
        'settings.sidebarMode.native': 'Official sidebar',
        'settings.showBlankSessions': 'Show blank session drafts',
      },
    }

    let pluginCtx = null
    let localeId = 'zh'

    function isZh() {
      return String(localeId || '').toLowerCase().startsWith('zh')
    }

    function t(key, vars) {
      const dict = isZh() ? DICT.zh : DICT.en
      let text = dict[key] ?? DICT.en[key] ?? key
      if (vars && typeof text === 'string') {
        for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value))
      }
      return text
    }

    // ------------------------------------------------------------------ 状态仓库

    const listeners = new Set()
    /** 本地归档意图：Host 队列尚未处理完时，刷新结果不得覆盖它（防回弹）。 */
    const archivedOverrides = new Map()
    /** 完成后的绿灯：当前会话 5 秒自动解除；非当前会话常亮直到点开。 */
    const completionFlash = new Map()
    const completionSticky = new Set()
    let version = 0
    const cache = { version: -1, value: null }

    const store = {
      ready: false,
      revision: 0,
      colors: {},
      priorities: {},
      favorites: new Set(),
      workspaceFavorites: new Set(),
      settings: {
        enabled: true,
        sidebarMode: 'native',
        notify: { complete: true, waiting: true, error: true, started: false },
        notifyWhenVisible: false,
        dnd: { enabled: false, start: '23:00', end: '08:00' },
      },
      capabilities: {},
      stateFile: '',
      dialog: null,
      toast: null,
      sidebar: null,
      sidebarError: '',
      sidebarLoading: false,
      selectedSessionId: '',
      seenAt: new Map(),
      clientRev: { page: '', host: '', error: '', checked: false },
      search: null,
      hover: null,
    }

    function getSnapshot() {
      if (cache.version !== version) {
        cache.version = version
        cache.value = {
          ready: store.ready,
          revision: store.revision,
          colors: store.colors,
          priorities: store.priorities,
          favorites: store.favorites,
          workspaceFavorites: store.workspaceFavorites,
          settings: store.settings,
          capabilities: store.capabilities,
          stateFile: store.stateFile,
          dialog: store.dialog,
          toast: store.toast,
          sidebar: store.sidebar,
          sidebarError: store.sidebarError,
          sidebarLoading: store.sidebarLoading,
          selectedSessionId: store.selectedSessionId,
          clientRev: store.clientRev,
          search: store.search,
          hover: store.hover,
        }
      }
      return cache.value
    }

    function bump() {
      version += 1
      for (const listener of [...listeners]) {
        try {
          listener()
        } catch {
          // 单个订阅者失败不影响其他订阅者
        }
      }
    }

    function subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }

    function useSnapshot() {
      return React.useSyncExternalStore(subscribe, getSnapshot)
    }

    let toastTimer = null

    function pushToast(text) {
      store.toast = { text, id: Date.now() }
      bump()
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => {
        store.toast = null
        bump()
      }, 4200)
    }

    function openDialog(dialog) {
      store.dialog = dialog
      bump()
    }

    function closeDialog() {
      store.dialog = null
      bump()
    }

    // ------------------------------------------------------------------ 通信

    function pageBase() {
      try {
        const url = new URL(document.baseURI)
        const path = url.pathname
        const last = path.slice(path.lastIndexOf('/') + 1)
        if (/\.(html?|php|aspx?|jsp)$/i.test(last)) url.pathname = path.slice(0, path.lastIndexOf('/') + 1)
        else if (!path.endsWith('/')) url.pathname = `${path}/`
        return url
      } catch {
        return null
      }
    }

    function apiUrl(path) {
      const raw = `${API_PREFIX}${path}`
      const base = pageBase()
      if (!base) return raw
      try {
        return new URL(raw.slice(1), base).toString()
      } catch {
        return raw
      }
    }

    async function apiFetch(path, options = {}) {
      const response = await fetch(apiUrl(path), {
        credentials: 'same-origin',
        cache: 'no-store',
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
      })
      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      return data
    }

    function adoptState(data) {
      if (!data || typeof data !== 'object') return
      store.colors = data.colors && typeof data.colors === 'object' ? data.colors : {}
      store.priorities = data.priorities && typeof data.priorities === 'object' ? data.priorities : {}
      store.favorites = new Set(Array.isArray(data.favorites) ? data.favorites : [])
      store.workspaceFavorites = new Set(Array.isArray(data.workspaceFavorites) ? data.workspaceFavorites : [])
      if (data.settings && typeof data.settings === 'object') store.settings = data.settings
      store.capabilities = data.capabilities && typeof data.capabilities === 'object' ? data.capabilities : {}
      store.stateFile = typeof data.stateFile === 'string' ? data.stateFile : ''
      store.revision = typeof data.revision === 'number' ? data.revision : store.revision
      store.ready = true
      if (typeof sidebarModeSync === 'function') sidebarModeSync()
      if (store.sidebar === null) refreshSidebar().catch(() => {})
      bump()
    }

    let refreshing = null

    async function refreshState() {
      if (refreshing) return refreshing
      refreshing = apiFetch('state')
        .then((data) => {
          adoptState(data)
          return data
        })
        .finally(() => {
          refreshing = null
        })
      return refreshing
    }

    // ------------------------------------------------------------------ 界面版本

    function pageClientRev() {
      try {
        const boot = window.__DSH_BOOT__
        const entries = Array.isArray(boot?.entries) ? boot.entries : []
        const entry = entries.find((item) => item && item.id === 'dsh-workspace-optimize')
        return typeof entry?.rev === 'string' ? entry.rev : ''
      } catch {
        return ''
      }
    }

    let checkingRev = null

    async function checkClientRev() {
      if (checkingRev) return checkingRev
      checkingRev = apiFetch('client-rev')
        .then((data) => {
          store.clientRev = {
            page: pageClientRev(),
            host: typeof data.rev === 'string' ? data.rev : '',
            error: data.ok === false ? String(data.error ?? '') : '',
            checked: true,
          }
          return data
        })
        .catch((error) => {
          store.clientRev = {
            page: pageClientRev(),
            host: '',
            error: error instanceof Error ? error.message : String(error),
            checked: true,
          }
        })
        .finally(() => {
          checkingRev = null
          bump()
        })
      return checkingRev
    }

    async function reloadUi() {
      // 先确认 Host 已经重建出新的界面 bundle；版本一致时重载只会拿到同一份旧代码，
      // 且在宿主重建过程中重载会因 bundle rev 不匹配导致 import 失败。
      try {
        const data = await apiFetch('client-rev')
        const pageRev = pageClientRev()
        const hostRev = typeof data.rev === 'string' ? data.rev : ''
        if (pageRev && hostRev && pageRev === hostRev) {
          pushToast(t('settings.reloadSameRev'))
          return
        }
      } catch {
        // 拿不到版本时按原行为尝试重载
      }
      // 先主动断开 SSE，减少页面重载后宿主侧的残留连接（避免 409/报错）。
      try {
        disconnectChannel()
      } catch {
        // 通道已关闭
      }
      setTimeout(() => {
        try {
          window.location.reload()
        } catch {
          pushToast(t('settings.reloadFailed'))
        }
      }, 150)
    }

    // ------------------------------------------------------------------ 自绘侧栏数据

    let refreshingSidebar = null
    let sidebarSeq = 0
    let pendingSidebarRefresh = false
    // 未完成的写操作计数：刷新必须等它们全部结束，否则会读到中间状态并覆盖乐观更新。
    let pendingWrites = 0
    let writeWaiters = []

    function beginWrite() {
      pendingWrites += 1
    }

    function endWrite() {
      pendingWrites = Math.max(0, pendingWrites - 1)
      if (pendingWrites === 0 && writeWaiters.length > 0) {
        const waiters = writeWaiters.splice(0)
        for (const resolve of waiters) resolve()
      }
    }

    function waitWritesDone(timeoutMs = 3000) {
      if (pendingWrites === 0) return Promise.resolve()
      return new Promise((resolve) => {
        const finish = () => {
          clearTimeout(timer)
          resolve()
        }
        const timer = setTimeout(() => {
          const index = writeWaiters.indexOf(finish)
          if (index >= 0) writeWaiters.splice(index, 1)
          resolve()
        }, timeoutMs)
        writeWaiters.push(finish)
      })
    }

    async function refreshSidebar() {
      // 等所有写操作落地、并确保 Host 已收到失效通知，再拉数据；
      // 否则可能读到写操作前的中间快照并覆盖乐观更新（回弹）。
      await waitWritesDone()
      await waitInvalidate()
      if (refreshingSidebar) {
        // 单飞期间的新请求：结束后再补一次，保证拿到最新数据
        pendingSidebarRefresh = true
        return refreshingSidebar
      }
      const seq = ++sidebarSeq
      store.sidebarLoading = true
      bump()
      refreshingSidebar = apiFetch('sidebar')
        .then((data) => {
          if (seq !== sidebarSeq) return data
          if (data && data.ok !== false) {
            store.sidebar = mergeArchivedOverrides(mergeOrderOverrides(data))
            store.sidebarError = ''
          } else {
            store.sidebarError = (data && data.error) || '侧栏数据无效'
          }
          return data
        })
        .catch((error) => {
          if (seq === sidebarSeq) store.sidebarError = error instanceof Error ? error.message : String(error)
        })
        .finally(() => {
          store.sidebarLoading = false
          refreshingSidebar = null
          bump()
          if (pendingSidebarRefresh) {
            pendingSidebarRefresh = false
            void refreshSidebar()
          }
        })
      return refreshingSidebar
    }

    // ------------------------------------------------------------------ 正文搜索

    let searchTimer = null
    let searchAbort = null
    let searchSeq = 0

    function readString(...values) {
      for (const value of values) if (typeof value === 'string' && value.length > 0) return value
      return ''
    }

    function normalizeSearchHit(item) {
      if (!item || typeof item !== 'object') return null
      const id = item.sessionId ?? item.id
      if (typeof id !== 'string' || id.length === 0) return null
      return {
        id,
        title: readString(item.title, item.displayTitle, item.sessionTitle),
        snippet: readString(item.snippet, item.excerpt, item.preview, item.text),
      }
    }

    async function runSearch(query) {
      const trimmed = String(query || '').trim()
      const sessions = pluginCtx?.get?.('sessions')
      if (!trimmed || !sessions || typeof sessions.search !== 'function') {
        store.search = trimmed ? { query: trimmed, items: [], error: '' } : null
        bump()
        return
      }
      const seq = ++searchSeq
      if (searchAbort) {
        try {
          searchAbort.abort()
        } catch {
          // 旧请求已结束
        }
      }
      searchAbort = new AbortController()
      try {
        const result = await sessions.search(trimmed, searchAbort.signal)
        if (seq !== searchSeq) return
        const items = Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.value?.items)
            ? result.value.items
            : []
        store.search = {
          query: trimmed,
          items: items.map(normalizeSearchHit).filter(Boolean).slice(0, 30),
          error: '',
        }
      } catch (error) {
        if (seq !== searchSeq) return
        if (error && error.name === 'AbortError') return
        store.search = { query: trimmed, items: [], error: error instanceof Error ? error.message : String(error) }
      }
      bump()
    }

    function scheduleSearch(query) {
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        searchTimer = null
        void runSearch(query)
      }, 300)
    }

    let sidebarRefreshTimer = null
    let sidebarLastRefresh = 0

    /**
     * 状态事件用「首个立即刷新」尽快反映黄灯/绿灯；
     * 写操作传 { debounce: true }，等用户停止操作 300ms 后合并成一次刷新。
     */
    function scheduleSidebarRefresh(options = {}) {
      const debounceOnly = options && options.debounce === true
      const now = Date.now()
      const elapsed = now - sidebarLastRefresh
      if (!debounceOnly && elapsed >= 300) {
        sidebarLastRefresh = now
        if (store.settings.sidebarMode === 'optimized') refreshSidebar().catch(() => {})
        return
      }
      if (sidebarRefreshTimer) return
      const delay = debounceOnly ? 300 : Math.max(0, 300 - elapsed)
      sidebarRefreshTimer = setTimeout(() => {
        sidebarRefreshTimer = null
        sidebarLastRefresh = Date.now()
        if (store.settings.sidebarMode === 'optimized') refreshSidebar().catch(() => {})
      }, delay)
    }

    let pendingInvalidate = null

    /** 通知 Host 失效侧栏快照（官方 Remote 写操作后调用，失败静默）。返回可等待的 Promise。 */
    function invalidateSidebar(sessionId) {
      pendingInvalidate = apiFetch('invalidate', {
        method: 'POST',
        body: JSON.stringify(sessionId ? { sessionId } : {}),
      }).catch(() => {})
      return pendingInvalidate
    }

    /** 刷新前等待最近一次失效请求处理完毕，保证 Host 端缓存已标记 dirty。 */
    async function waitInvalidate() {
      if (!pendingInvalidate) return
      const pending = pendingInvalidate
      pendingInvalidate = null
      await pending
    }

    /** 本地修改侧栏数据并立即重绘（乐观更新；后台刷新会校正）。 */
    function updateSidebar(mutator) {
      const sidebar = store.sidebar
      if (!sidebar) return
      store.sidebar = mutator(sidebar)
      bump()
    }

    /** 本地排序意图：Host 写入队列未处理完时，刷新结果不得覆盖它（防回弹）。 */
    const orderOverrides = new Map()

    /** 在本地按「插到某会话之前（undefined 表示末尾）」重排会话顺序，并记录目标顺序。 */
    function applyOrderLocally(workspaceId, sessionId, beforeSessionId) {
      updateSidebar((sidebar) => ({
        ...sidebar,
        workspaces: (sidebar.workspaces ?? []).map((workspace) => {
          if (workspace.id !== workspaceId) return workspace
          const ids = workspace.sessionIds.filter((id) => id !== sessionId)
          const index = beforeSessionId ? ids.indexOf(beforeSessionId) : -1
          if (index >= 0) ids.splice(index, 0, sessionId)
          else ids.push(sessionId)
          orderOverrides.set(workspaceId, ids)
          return { ...workspace, sessionIds: ids }
        }),
      }))
    }

    /**
     * 排序也应用本地意图覆盖：与目标顺序不一致时保留本地顺序，
     * 直到 Host 顺序与目标一致（或长度变化，说明有新会话，交还 Host）。
     */
    function mergeOrderOverrides(data) {
      if (!data || orderOverrides.size === 0) return data
      const workspaces = (Array.isArray(data.workspaces) ? data.workspaces : []).map((workspace) => {
        const target = orderOverrides.get(workspace.id)
        if (!target) return workspace
        if (!Array.isArray(workspace.sessionIds) || workspace.sessionIds.length !== target.length) {
          orderOverrides.delete(workspace.id)
          return workspace
        }
        const same = target.every((id, index) => workspace.sessionIds[index] === id)
        if (same) {
          orderOverrides.delete(workspace.id)
          return workspace
        }
        return { ...workspace, sessionIds: target }
      })
      return { ...data, workspaces }
    }

    let sidebarModeSync = null

    async function toggleWorkspaceFavorite(workspaceId) {
      const favorite = !store.workspaceFavorites.has(workspaceId)
      try {
        const data = await apiFetch('workspace', {
          method: 'POST',
          body: JSON.stringify({ workspaceId, favorite }),
        })
        store.workspaceFavorites = new Set(Array.isArray(data.workspaceFavorites) ? data.workspaceFavorites : [])
        bump()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const VIEW_KEY = 'dwo.sidebar.view'

    function loadView() {
      let saved = {}
      try {
        saved = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}') || {}
      } catch {
        saved = {}
      }
      return {
        order: saved.order === 'manual' ? 'manual' : 'updated',
        filter: saved.filter === 'show' || saved.filter === 'only' ? saved.filter : 'hide',
        groupBy: saved.groupBy === 'flat' ? 'flat' : 'tree',
        folded: saved.folded && typeof saved.folded === 'object' ? saved.folded : {},
        search: '',
        searchOpen: false,
      }
    }

    const view = loadView()

    function persistView() {
      try {
        localStorage.setItem(
          VIEW_KEY,
          JSON.stringify({ order: view.order, filter: view.filter, groupBy: view.groupBy, folded: view.folded }),
        )
      } catch {
        // 浏览器拒绝本地存储时只在本次会话生效
      }
      bump()
    }

    function toggleFold(workspaceId) {
      const next = { ...view.folded }
      if (next[workspaceId]) delete next[workspaceId]
      else next[workspaceId] = true
      view.folded = next
      persistView()
    }

    function setOrderMode(mode) {
      view.order = mode === 'manual' ? 'manual' : 'updated'
      persistView()
    }

    function setGroupBy(mode) {
      view.groupBy = mode === 'tree' ? 'tree' : 'flat'
      persistView()
    }

    function setArchivedFilter(filter) {
      view.filter = filter === 'show' || filter === 'only' ? filter : 'hide'
      persistView()
    }

    let hoverTimer = null

    function scheduleHover(sessionId, element) {
      if (hoverTimer) clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        hoverTimer = null
        let x = 260
        let y = 140
        try {
          const rect = element.getBoundingClientRect()
          x = Math.min(rect.right + 8, Math.max(8, (window.innerWidth || 1024) - 300))
          y = Math.min(rect.top, Math.max(8, (window.innerHeight || 768) - 210))
        } catch {
          // 使用默认位置
        }
        store.hover = { sessionId, x, y }
        bump()
      }, 450)
    }

    function hideHover() {
      if (hoverTimer) {
        clearTimeout(hoverTimer)
        hoverTimer = null
      }
      if (store.hover) {
        store.hover = null
        bump()
      }
    }

    function selectSession(sessionId) {
      store.selectedSessionId = sessionId
      // 打开会话即视为已查看，清掉「完成未查看」绿点
      store.seenAt.set(sessionId, Date.now())
      completionFlash.delete(sessionId)
      completionSticky.delete(sessionId)
      bump()
      const ui = pluginCtx?.get?.('uiWorkspace')
      if (ui && typeof ui.openSession === 'function') {
        try {
          ui.openSession(sessionId)
          return
        } catch {
          // 回退
        }
      }
      pushToast(t('sidebar.openFailed'))
    }

    function startSession(workspaceId) {
      const ui = pluginCtx?.get?.('uiWorkspace')
      if (ui && typeof ui.startSession === 'function') {
        try {
          ui.startSession(workspaceId)
          return
        } catch {
          // 回退
        }
      }
      pushToast(t('sidebar.openFailed'))
    }

    /** 归档/恢复后先本地更新，让列表立刻按当前过滤隐藏或出现，再后台刷新校正。 */
    function applyArchivedLocally(sessionId, archived) {
      archivedOverrides.set(sessionId, archived)
      const sidebar = store.sidebar
      if (!sidebar || !Array.isArray(sidebar.sessions)) return
      const sessions = sidebar.sessions.map((session) =>
        session.id === sessionId ? { ...session, archived } : session,
      )
      const archivedIds = new Set(Array.isArray(sidebar.archivedSessionIds) ? sidebar.archivedSessionIds : [])
      if (archived) archivedIds.add(sessionId)
      else archivedIds.delete(sessionId)
      store.sidebar = { ...sidebar, sessions, archivedSessionIds: [...archivedIds] }
      bump()
    }

    /**
     * 把 Host 返回的快照与本地归档意图合并：
     * 不一致时保留本地目标（避免回弹），直到 Host 状态与目标一致才解除。
     */
    function mergeArchivedOverrides(data) {
      if (!data || archivedOverrides.size === 0) return data
      const sessions = (Array.isArray(data.sessions) ? data.sessions : []).map((session) => {
        const target = archivedOverrides.get(session.id)
        if (target === undefined) return session
        if (session.archived === target) {
          archivedOverrides.delete(session.id)
          return session
        }
        return { ...session, archived: target }
      })
      if (archivedOverrides.size === 0) return { ...data, sessions }
      const ids = new Set(Array.isArray(data.archivedSessionIds) ? data.archivedSessionIds : [])
      for (const [id, target] of archivedOverrides) {
        if (target) ids.add(id)
        else ids.delete(id)
      }
      return { ...data, sessions, archivedSessionIds: [...ids] }
    }

    async function archiveSession(sessionId) {
      const workspaces = pluginCtx?.get?.('workspaces')
      if (!workspaces || typeof workspaces.archiveSession !== 'function') return
      // 先本地更新：连续快速归档时不排队等 Remote 往返。
      applyArchivedLocally(sessionId, true)
      beginWrite()
      try {
        await workspaces.archiveSession(sessionId, { stopActivity: false })
        invalidateSidebar(sessionId)
        pushToast(t('sidebar.archived'))
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        applyArchivedLocally(sessionId, false)
        invalidateSidebar(sessionId)
        scheduleSidebarRefresh({ debounce: true })
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    async function unarchiveSession(sessionId) {
      const workspaces = pluginCtx?.get?.('workspaces')
      if (!workspaces || typeof workspaces.unarchiveSession !== 'function') return
      applyArchivedLocally(sessionId, false)
      beginWrite()
      try {
        await workspaces.unarchiveSession(sessionId)
        invalidateSidebar(sessionId)
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        applyArchivedLocally(sessionId, true)
        invalidateSidebar(sessionId)
        scheduleSidebarRefresh({ debounce: true })
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    async function copySessionId(sessionId) {
      try {
        await navigator.clipboard.writeText(sessionId)
        pushToast(t('sidebar.copied'))
      } catch {
        pushToast(sessionId)
      }
    }

    async function createWorkspace() {
      const ui = pluginCtx?.get?.('uiWorkspace')
      const workspaces = pluginCtx?.get?.('workspaces')
      if (!ui || typeof ui.pickDirectory !== 'function' || !workspaces) {
        pushToast(t('sidebar.addUnavailable'))
        return
      }
      try {
        const path = await ui.pickDirectory()
        if (!path) return
        beginWrite()
        let view
        try {
          view = await workspaces.create({ path })
        } finally {
          endWrite()
        }
        const workspaceId = view?.id ?? view?.workspace?.id
        if (typeof workspaceId === 'string' && workspaceId.length > 0) {
          updateSidebar((sidebar) => ({
            ...sidebar,
            workspaces: [
              ...(sidebar.workspaces ?? []),
              { id: workspaceId, title: baseName(path), path, sessionIds: [] },
            ],
          }))
        }
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function renameWorkspace(workspaceId, title) {
      const workspaces = pluginCtx?.get?.('workspaces')
      if (!workspaces || typeof workspaces.rename !== 'function') return
      updateSidebar((sidebar) => ({
        ...sidebar,
        workspaces: (sidebar.workspaces ?? []).map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, title } : workspace,
        ),
      }))
      beginWrite()
      try {
        await workspaces.rename(workspaceId, title)
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    async function renameSession(sessionId, title) {
      updateSidebar((sidebar) => ({
        ...sidebar,
        sessions: (sidebar.sessions ?? []).map((session) => (session.id === sessionId ? { ...session, title } : session)),
      }))
      beginWrite()
      try {
        await apiFetch('rename', { method: 'POST', body: JSON.stringify({ sessionId, title }) })
        invalidateSidebar(sessionId)
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        invalidateSidebar(sessionId)
        scheduleSidebarRefresh({ debounce: true })
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    async function deleteSession(sessionId, title) {
      // 官方没有删除会话的 API（只能归档），此函数仅为兼容旧调用保留占位。
      void sessionId
      void title
      pushToast(t('session.deleteUnsupported'))
    }

    async function togglePinned(sessionId) {
      const pinned = isPinned(sessionId)
      beginWrite()
      try {
        await apiFetch('pin', { method: 'POST', body: JSON.stringify({ sessionId, pinned: !pinned }) })
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    function isPinned(sessionId) {
      const sidebar = store.sidebar
      return Boolean(sidebar && Array.isArray(sidebar.pinnedSessionIds) && sidebar.pinnedSessionIds.includes(sessionId))
    }

    async function toggleFavoriteById(sessionId) {
      const favorite = !store.favorites.has(sessionId)
      try {
        const data = await apiFetch('favorite', {
          method: 'POST',
          body: JSON.stringify({ sessionId, favorite }),
        })
        store.favorites = new Set(Array.isArray(data.favorites) ? data.favorites : [])
        store.ready = true
        bump()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function toggleFavorite(sessionId) {
      const favorite = !store.favorites.has(sessionId)
      try {
        const data = await apiFetch('favorite', {
          method: 'POST',
          body: JSON.stringify({ sessionId, favorite }),
        })
        store.favorites = new Set(Array.isArray(data.favorites) ? data.favorites : [])
        store.ready = true
        bump()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function setColor(sessionId, color) {
      try {
        await apiFetch('color', { method: 'POST', body: JSON.stringify({ sessionId, color }) })
        await refreshState()
        closeDialog()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function setPriority(sessionId, priority) {
      try {
        await apiFetch('priority', { method: 'POST', body: JSON.stringify({ sessionId, priority }) })
        await refreshState()
        closeDialog()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function applyOrder(sessionId, action) {
      try {
        const data = await apiFetch(`order?sessionId=${encodeURIComponent(sessionId)}&action=${encodeURIComponent(action)}`)
        const target = data.target
        if (!target) {
          pushToast(t('toast.orderUnavailable'))
          return
        }
        if (target.unchanged) {
          pushToast(t('toast.unchanged'))
          return
        }
        const workspaces = pluginCtx?.get?.('workspaces')
        if (!workspaces || typeof workspaces.insertSessionBefore !== 'function') {
          pushToast(t('toast.noOrderApi'))
          return
        }
        // 先本地重排，界面立即反映；Remote 写入放后台。
        applyOrderLocally(target.workspaceId, target.sessionId, target.beforeSessionId)
        closeDialog()
        beginWrite()
        try {
          await workspaces.insertSessionBefore(target.workspaceId, target.sessionId, target.beforeSessionId)
          invalidateSidebar()
          pushToast(t('toast.orderDone'))
          scheduleSidebarRefresh({ debounce: true })
        } catch (error) {
          orderOverrides.delete(target.workspaceId)
          invalidateSidebar()
          scheduleSidebarRefresh({ debounce: true })
          pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
        } finally {
          endWrite()
        }
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function setPinned(sessionId, pinned) {
      try {
        await apiFetch('pin', { method: 'POST', body: JSON.stringify({ sessionId, pinned }) })
        pushToast(pinned ? t('toast.pinDone') : t('toast.unpinDone'))
        closeDialog()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function moveSession(sessionId, targetWorkspaceId) {
      beginWrite()
      try {
        await apiFetch('move', {
          method: 'POST',
          body: JSON.stringify({ sessionId, targetWorkspaceId }),
        })
        pushToast(t('toast.moveDone'))
        closeDialog()
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    async function updateSettings(patch) {
      try {
        const data = await apiFetch('settings', { method: 'POST', body: JSON.stringify(patch) })
        if (data.settings) store.settings = data.settings
        bump()
        if (Object.prototype.hasOwnProperty.call(patch, 'showBlankSessions')) {
          refreshSidebar().catch(() => {})
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'sidebarMode') && typeof sidebarModeSync === 'function') {
          // 未声明子插槽时，覆盖只是让官方 entry 变为 inactive、仍留在槽位里，
          // 撤销注册即可原地恢复官方侧栏，因此两个方向都无需重载页面。
          sidebarModeSync()
        }
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    function openSession(sessionId) {
      const ui = pluginCtx?.get?.('uiWorkspace')
      if (!ui || typeof ui.openSession !== 'function') return
      try {
        ui.openSession(sessionId)
        return
      } catch {
        // 回退到对象形式
      }
      try {
        ui.openSession({ sessionId })
      } catch {
        // 无法导航时保持当前视图
      }
    }

    // ------------------------------------------------------------------ 通知

    function inDnd(dnd) {
      if (!dnd || dnd.enabled !== true) return false
      const parse = (value) => {
        const [hour, minute] = String(value ?? '').split(':')
        return (Number(hour) || 0) * 60 + (Number(minute) || 0)
      }
      const start = parse(dnd.start)
      const end = parse(dnd.end)
      if (start === end) return false
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end
    }

    function pageVisible() {
      return document.visibilityState === 'visible' && document.hasFocus()
    }

    function notifyNow(title, body, tag, onClick) {
      try {
        const notification = new Notification(title, { body, tag, silent: false })
        notification.onclick = () => {
          try {
            window.focus()
          } catch {
            // 某些宿主不允许脚本聚焦
          }
          onClick()
          try {
            notification.close()
          } catch {
            // 已关闭
          }
        }
        return true
      } catch {
        return false
      }
    }

    function showNotification(event) {
      const fallbackName = typeof event.sessionId === 'string' ? event.sessionId.slice(0, 8) : ''
      const isComplete = event.kind === 'complete'
      const isWaiting = event.kind === 'waiting'
      const isPlan = isWaiting && event.detail === 'plan'
      // 完成：会话标题 + 最终答复；计划待审：单独标题；等待交互：会话标题 + 所需权限/问题标题。
      const title = isPlan ? t('sidebar.pendingPlan') : t(`notify.${event.kind}`)
      const partsForBody = isComplete
        ? [event.title, event.summary]
        : isWaiting
          ? [event.title, event.label]
          : [event.title]
      const body =
        partsForBody.filter((part) => typeof part === 'string' && part.length > 0).join('\n') || fallbackName
      const onClick = () => openSession(event.sessionId)
      const fallback = () => pushToast(`${title}${body ? ` · ${body}` : ''}`)

      if (typeof Notification === 'undefined') {
        fallback()
        return
      }
      if (Notification.permission === 'granted') {
        if (!notifyNow(title, body, event.sessionId, onClick)) fallback()
        return
      }
      if (Notification.permission === 'default') {
        try {
          Notification.requestPermission()
            .then((permission) => {
              if (permission === 'granted') {
                if (!notifyNow(title, body, event.sessionId, onClick)) fallback()
              } else {
                pushToast(t('toast.permissionDenied'))
                fallback()
              }
            })
            .catch(fallback)
          return
        } catch {
          fallback()
          return
        }
      }
      fallback()
    }

    function onSessionEvent(event) {
      if (!event || typeof event !== 'object') return
      scheduleSidebarRefresh()
      if (event.kind === 'complete' && typeof event.sessionId === 'string') {
        if (store.selectedSessionId === event.sessionId) {
          // 用户就在这个会话：绿灯 5 秒后自动解除
          completionFlash.set(event.sessionId, Date.now() + 5000)
          setTimeout(() => {
            completionFlash.delete(event.sessionId)
            bump()
          }, 5100)
        } else {
          // 用户不在这个会话：绿灯一直保留，直到点开该会话
          completionSticky.add(event.sessionId)
          bump()
        }
      }
      if (store.settings.enabled === false) return
      const notify = store.settings.notify ?? {}
      if (notify[event.kind] !== true) return
      if (inDnd(store.settings.dnd)) return
      const visible = pageVisible()
      if (visible && store.settings.notifyWhenVisible !== true) return
      showNotification(event)
    }

    // ------------------------------------------------------------------ 通道

    let eventSource = null
    let pollTimer = null

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    function startPolling() {
      if (pollTimer) return
      pollTimer = setInterval(() => {
        refreshState().catch(() => {})
      }, 5000)
    }

    function handleFrame(frame) {
      if (!frame || typeof frame !== 'object') return
      if (frame.type === 'state') {
        refreshState().catch(() => {})
        return
      }
      if (frame.type === 'event' && frame.event) onSessionEvent(frame.event)
    }

    function connectChannel() {
      stopPolling()
      if (typeof EventSource === 'undefined') {
        startPolling()
        return
      }
      try {
        eventSource = new EventSource(apiUrl('events'))
      } catch {
        startPolling()
        return
      }
      eventSource.onmessage = (message) => {
        try {
          handleFrame(JSON.parse(message.data))
        } catch {
          // 忽略非 JSON 心跳
        }
      }
      eventSource.onerror = () => {
        // EventSource 会自行重连；轮询只是兜底，保证隐藏页面也能收到状态更新。
        startPolling()
      }
    }

    function disconnectChannel() {
      if (eventSource) {
        try {
          eventSource.close()
        } catch {
          // 已关闭
        }
        eventSource = null
      }
      stopPolling()
    }

    // ------------------------------------------------------------------ 图标与基础控件

    function StarIcon(props) {
      const filled = props && props.filled === true
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props?.size ?? 15,
          height: props?.size ?? 15,
          'aria-hidden': true,
          fill: filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M12 3.6l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z' }),
      )
    }

    function ArchiveIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.15,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M2.4 3.4h11.2v3.1H2.4z' }),
        h('path', { d: 'M3.5 6.5h9v6.6h-9z' }),
        h('path', { d: 'M8 8.3v3.2M6.5 10.2L8 11.7l1.5-1.5' }),
      )
    }

    function RestoreIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.15,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M2.4 3.4h11.2v3.1H2.4z' }),
        h('path', { d: 'M3.5 6.5h9v6.6h-9z' }),
        h('path', { d: 'M8 11.6V8.4M6.5 9.8L8 8.3l1.5 1.5' }),
      )
    }

    function PlusIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 14
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.35,
          strokeLinecap: 'round',
        },
        h('path', { d: 'M8 3.2v9.6M3.2 8h9.6' }),
      )
    }

    function ColorIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', width: 15, height: 15, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 },
        h('circle', { cx: 12, cy: 12, r: 8 }),
        h('circle', { cx: 12, cy: 12, r: 2.4, fill: 'currentColor', stroke: 'none' }),
      )
    }

    function OrderIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', width: 15, height: 15, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' },
        h('path', { d: 'M5 7h14M5 12h9M5 17h5' }),
      )
    }

    function MoveIcon() {
      return h(
        'svg',
        { viewBox: '0 0 24 24', width: 15, height: 15, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' },
        h('path', { d: 'M4 7.5A2.5 2.5 0 016.5 5h3l2 2.5h6A2.5 2.5 0 0120 10v7a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17z' }),
        h('path', { d: 'M10 13.5h5m-2-2l2 2-2 2' }),
      )
    }

    function Toggle(props) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': props.checked === true,
          className: `dwo-toggle${props.checked ? ' dwo-toggle-on' : ''}`,
          disabled: props.disabled === true,
          onClick: () => props.onChange?.(!props.checked),
        },
        h('span', { className: 'dwo-toggle-knob' }),
      )
    }

    function DialogShell(props) {
      return h(
        'div',
        {
          className: 'dwo-overlay',
          role: 'presentation',
          onClick: (event) => {
            if (event.target === event.currentTarget) closeDialog()
          },
        },
        h(
          'div',
          { className: 'dwo-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': props.title },
          h(
            'div',
            { className: 'dwo-dialog-head' },
            h('span', { className: 'dwo-dialog-title' }, props.title),
            h('button', { type: 'button', className: 'dwo-icon-button', onClick: closeDialog, 'aria-label': t('common.close') }, '×'),
          ),
          h('div', { className: 'dwo-dialog-body' }, props.children),
        ),
      )
    }

    // ------------------------------------------------------------------ 会话行插槽

    function useMenuStateFactory(props) {
      const factory = typeof props?.useMenuOpenState === 'function' ? props.useMenuOpenState : null
      if (factory) return factory
      return function useFallbackMenuState() {
        return [false, () => {}]
      }
    }

    // 官方菜单项组件是 Module Loader 的 baseline external（见 ui-workspace README
    // 的「Dynamic client package」一节）：用它可得到与宿主其它菜单项完全一致的
    // 缩进、字号与悬停样式。取不到时回退到自绘按钮（无图标、同一内边距）。
    let hostMenuItem = null
    try {
      const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
      if (primitives && typeof primitives.MenuItemButton === 'function') hostMenuItem = primitives.MenuItemButton
    } catch {
      hostMenuItem = null
    }

    function MenuEntry(props) {
      if (hostMenuItem) {
        return h(hostMenuItem, { onSelect: props.onSelect, disabled: props.disabled === true }, props.children)
      }
      return h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          className: 'dwo-menu-item',
          disabled: props.disabled === true,
          onClick: props.onSelect,
        },
        props.children,
      )
    }

    function FavoriteMenuItem(props) {
      const useMenuState = useMenuStateFactory(props)
      const menuState = useMenuState()
      const setMenuOpen = typeof menuState?.[1] === 'function' ? menuState[1] : () => {}
      const snap = useSnapshot()
      const favorite = snap.favorites.has(props.sessionId)
      return h(
        MenuEntry,
        {
          onSelect: () => {
            setMenuOpen(false)
            void toggleFavorite(props.sessionId)
          },
        },
        favorite ? t('fav.remove') : t('fav.add'),
      )
    }

    function ColorMenuItem(props) {
      const useMenuState = useMenuStateFactory(props)
      const menuState = useMenuState()
      const setMenuOpen = typeof menuState?.[1] === 'function' ? menuState[1] : () => {}
      return h(
        MenuEntry,
        {
          onSelect: () => {
            setMenuOpen(false)
            openDialog({ kind: 'color', sessionId: props.sessionId, title: props.displayTitle })
          },
        },
        t('color.menu'),
      )
    }

    function OrderMenuItem(props) {
      const useMenuState = useMenuStateFactory(props)
      const menuState = useMenuState()
      const setMenuOpen = typeof menuState?.[1] === 'function' ? menuState[1] : () => {}
      return h(
        MenuEntry,
        {
          onSelect: () => {
            setMenuOpen(false)
            openDialog({ kind: 'order', sessionId: props.sessionId, title: props.displayTitle })
          },
        },
        t('order.menu'),
      )
    }

    function MoveMenuItem(props) {
      const useMenuState = useMenuStateFactory(props)
      const menuState = useMenuState()
      const setMenuOpen = typeof menuState?.[1] === 'function' ? menuState[1] : () => {}
      const snap = useSnapshot()
      if (snap.capabilities?.move !== true) return null
      return h(
        MenuEntry,
        {
          onSelect: () => {
            setMenuOpen(false)
            openDialog({ kind: 'move', sessionId: props.sessionId, title: props.displayTitle })
          },
        },
        t('move.menu'),
      )
    }

    function FavoriteRowAction(props) {
      const snap = useSnapshot()
      const favorite = snap.favorites.has(props.sessionId)
      const label = favorite ? t('fav.remove') : t('fav.add')
      return h(
        'button',
        {
          type: 'button',
          className: 'dwo-row-action',
          title: label,
          'aria-label': label,
          'aria-pressed': favorite,
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            void toggleFavorite(props.sessionId)
          },
        },
        h(StarIcon, { filled: favorite, size: 14 }),
      )
    }

    function RowMark(props) {
      const snap = useSnapshot()
      const color = snap.colors[props.sessionId]
      const favorite = snap.favorites.has(props.sessionId)
      if (!color && !favorite) return null
      return h(
        'span',
        {
          className: 'dwo-mark',
          style: { background: color ? COLOR_HEX[color] : 'transparent' },
          title: color ? t(`color.name.${color}`) : t('fav.label'),
        },
        favorite ? h(StarIcon, { filled: true, size: 9 }) : null,
      )
    }

    function HoverInfo(props) {
      const snap = useSnapshot()
      const parts = []
      const color = snap.colors[props.sessionId]
      if (color) parts.push(t(`color.name.${color}`))
      if (snap.favorites.has(props.sessionId)) parts.push(t('fav.label'))
      const priority = snap.priorities[props.sessionId]
      if (typeof priority === 'number') parts.push(t('priority.value', { value: priority }))
      if (parts.length === 0) return null
      return h('div', { className: 'dwo-hover' }, parts.join(' · '))
    }

    // ------------------------------------------------------------------ 弹层

    function ColorPicker(props) {
      const sessionId = props.sessionId
      const current = props.current
      const snap = useSnapshot()
      const priority = snap.priorities[sessionId]
      return h(
        DialogShell,
        { title: t('color.title') },
        h(
          'div',
          { className: 'dwo-swatches' },
          COLORS.map((color) =>
            h('button', {
              key: color,
              type: 'button',
              className: `dwo-swatch${current === color ? ' dwo-swatch-active' : ''}`,
              style: { background: COLOR_HEX[color] },
              title: t(`color.name.${color}`),
              'aria-label': t(`color.name.${color}`),
              onClick: () => void setColor(sessionId, color),
            }),
          ),
        ),
        h(
          'div',
          { className: 'dwo-dialog-actions' },
          h('button', { type: 'button', className: 'dwo-button', onClick: () => void setColor(sessionId, null) }, t('color.clear')),
          h(
            'div',
            { className: 'dwo-priority-row' },
            h('span', { className: 'dwo-label' }, t('priority.value', { value: typeof priority === 'number' ? priority : '—' })),
            h(
              'input',
              {
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                value: typeof priority === 'number' ? priority : 50,
                className: 'dwo-range',
                onChange: (event) => void setPriority(sessionId, Number(event.target.value)),
              },
            ),
          ),
        ),
      )
    }

    function OrderPicker(props) {
      const sessionId = props.sessionId
      const snap = useSnapshot()
      const priority = snap.priorities[sessionId]
      const actions = [
        { key: 'pin', label: t('order.pin'), run: () => setPinned(sessionId, true) },
        { key: 'unpin', label: t('order.unpin'), run: () => setPinned(sessionId, false) },
        { key: 'top', label: t('order.top'), run: () => applyOrder(sessionId, 'top') },
        { key: 'up', label: t('order.up'), run: () => applyOrder(sessionId, 'up') },
        { key: 'down', label: t('order.down'), run: () => applyOrder(sessionId, 'down') },
        { key: 'bottom', label: t('order.bottom'), run: () => applyOrder(sessionId, 'bottom') },
      ]
      return h(
        DialogShell,
        { title: t('order.title') },
        h(
          'div',
          { className: 'dwo-button-grid' },
          actions.map((action) =>
            h('button', { key: action.key, type: 'button', className: 'dwo-button', onClick: () => void action.run() }, action.label),
          ),
        ),
        h('p', { className: 'dwo-hint' }, t('order.hint')),
        h(
          'div',
          { className: 'dwo-dialog-actions' },
          h(
            'div',
            { className: 'dwo-priority-row' },
            h('span', { className: 'dwo-label' }, t('priority.value', { value: typeof priority === 'number' ? priority : '—' })),
            h('input', {
              type: 'range',
              min: 0,
              max: 100,
              step: 1,
              value: typeof priority === 'number' ? priority : 50,
              className: 'dwo-range',
              onChange: (event) => void setPriority(sessionId, Number(event.target.value)),
            }),
          ),
          h('button', { type: 'button', className: 'dwo-button', onClick: () => void setPriority(sessionId, null) }, t('order.clear')),
        ),
      )
    }

    function MovePicker(props) {
      const sessionId = props.sessionId
      const [workspaces, setWorkspaces] = React.useState(null)
      const [busyId, setBusyId] = React.useState('')

      React.useEffect(() => {
        let cancelled = false
        apiFetch('workspaces')
          .then((data) => {
            if (!cancelled) setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : [])
          })
          .catch(() => {
            if (!cancelled) setWorkspaces([])
          })
        return () => {
          cancelled = true
        }
      }, [])

      const list = workspaces ?? []
      return h(
        DialogShell,
        { title: t('move.title') },
        h('p', { className: 'dwo-hint' }, t('move.warning')),
        workspaces === null
          ? h('p', { className: 'dwo-hint' }, '…')
          : list.length === 0
            ? h('p', { className: 'dwo-hint' }, t('move.empty'))
            : h(
                'div',
                { className: 'dwo-workspace-list' },
                list.map((workspace) =>
                  h(
                    'button',
                    {
                      key: workspace.id,
                      type: 'button',
                      className: 'dwo-workspace-row',
                      disabled: busyId.length > 0,
                      onClick: () => {
                        setBusyId(workspace.id)
                        void moveSession(sessionId, workspace.id).finally(() => setBusyId(''))
                      },
                    },
                    h('span', { className: 'dwo-workspace-title' }, workspace.title || workspace.id),
                    h('span', { className: 'dwo-workspace-path' }, workspace.path || ''),
                  ),
                ),
              ),
      )
    }

    function SettingsForm() {
      const snap = useSnapshot()
      const settings = snap.settings ?? {}
      const notify = settings.notify ?? {}
      const dnd = settings.dnd ?? {}
      const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
      const favoritesSource = snap.capabilities?.favoritesFromArchiveManager === true ? 'archive' : 'local'
      const rev = snap.clientRev ?? { page: '', host: '', error: '', checked: false }
      const outdated = rev.checked && rev.page.length > 0 && rev.host.length > 0 && rev.page !== rev.host

      React.useEffect(() => {
        if (!store.clientRev.checked) checkClientRev()
      }, [])

      const rows = [
        ['settings.enabled', settings.enabled !== false, (value) => updateSettings({ enabled: value })],
        ['settings.notify.complete', notify.complete === true, (value) => updateSettings({ notify: { complete: value } })],
        ['settings.notify.waiting', notify.waiting === true, (value) => updateSettings({ notify: { waiting: value } })],
        ['settings.notify.error', notify.error === true, (value) => updateSettings({ notify: { error: value } })],
        ['settings.notify.started', notify.started === true, (value) => updateSettings({ notify: { started: value } })],
        ['settings.notifyWhenVisible', settings.notifyWhenVisible === true, (value) => updateSettings({ notifyWhenVisible: value })],
        ['settings.showBlankSessions', settings.showBlankSessions === true, (value) => updateSettings({ showBlankSessions: value })],
        ['settings.dnd', dnd.enabled === true, (value) => updateSettings({ dnd: { enabled: value } })],
      ]

      return h(
        'div',
        { className: 'dwo-settings' },
        snap.ready ? null : h('p', { className: 'dwo-hint dwo-warning' }, t('settings.unavailable')),
        h(
          'div',
          { className: 'dwo-setting-row' },
          h('span', { className: 'dwo-setting-label' }, t('settings.sidebarMode')),
          h(
            'span',
            { className: 'dwo-hint' },
            settings.sidebarMode === 'native' ? t('settings.sidebarMode.native') : t('settings.sidebarMode.optimized'),
          ),
          h(Toggle, {
            checked: settings.sidebarMode !== 'native',
            onChange: (value) => updateSettings({ sidebarMode: value ? 'optimized' : 'native' }),
          }),
        ),
        rows.map(([key, checked, onChange]) =>
          h(
            'div',
            { className: 'dwo-setting-row', key },
            h('span', { className: 'dwo-setting-label' }, t(key)),
            h(Toggle, { checked, onChange }),
          ),
        ),
        dnd.enabled === true
          ? h(
              'div',
              { className: 'dwo-setting-row' },
              h('span', { className: 'dwo-setting-label' }, `${t('settings.dnd')}`),
              h('input', {
                type: 'time',
                className: 'dwo-time',
                value: dnd.start ?? '23:00',
                onChange: (event) => updateSettings({ dnd: { start: event.target.value } }),
              }),
              h('input', {
                type: 'time',
                className: 'dwo-time',
                value: dnd.end ?? '08:00',
                onChange: (event) => updateSettings({ dnd: { end: event.target.value } }),
              }),
            )
          : null,
        h(
          'div',
          { className: 'dwo-setting-row' },
          h('span', { className: 'dwo-setting-label' }, t('settings.permission')),
          h(
            'span',
            { className: 'dwo-hint' },
            permission === 'granted'
              ? t('settings.permission.granted')
              : permission === 'denied'
                ? t('settings.permission.denied')
                : permission === 'unsupported'
                  ? t('toast.permissionDenied')
                  : t('settings.permission.default'),
          ),
          permission === 'default'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dwo-button',
                  onClick: () => {
                    try {
                      Notification.requestPermission().then((result) => {
                        if (result !== 'granted') pushToast(t('toast.permissionDenied'))
                        else bump()
                      })
                    } catch {
                      pushToast(t('toast.permissionDenied'))
                    }
                  },
                },
                t('settings.permission.request'),
              )
            : null,
        ),
        h('p', { className: 'dwo-hint' }, t(favoritesSource === 'archive' ? 'settings.favoritesSource.archive' : 'settings.favoritesSource.local')),
        snap.capabilities?.move === true ? null : h('p', { className: 'dwo-hint dwo-warning' }, t('settings.moveUnavailable')),
        snap.stateFile ? h('p', { className: 'dwo-hint' }, `${t('settings.stateFile')}：${snap.stateFile}`) : null,
        h('div', { className: 'dwo-section-title' }, t('settings.maintenance')),
        h(
          'div',
          { className: 'dwo-setting-row' },
          h('span', { className: 'dwo-setting-label' }, t('settings.refreshSidebar')),
          h('button', { type: 'button', className: 'dwo-button', onClick: () => void refreshSidebar() }, t('settings.refreshSidebar')),
          h(
            'button',
            {
              type: 'button',
              className: `dwo-button${outdated ? ' dwo-button-primary' : ''}`,
              onClick: () => reloadUi(),
            },
            outdated ? t('settings.reloadNew') : t('settings.reloadUi'),
          ),
        ),
        h(
          'div',
          { className: 'dwo-setting-row' },
          h('span', { className: 'dwo-setting-label' }, t('settings.clientRev')),
          h(
            'span',
            { className: 'dwo-hint' },
            `${t('settings.pageRev')} ${rev.page || t('settings.revUnknown')} · ${t('settings.hostRevLabel')} ${rev.host || rev.error || t('settings.revUnknown')}`,
          ),
          h('button', { type: 'button', className: 'dwo-button', onClick: () => void checkClientRev() }, t('settings.checkVersion')),
        ),
        outdated ? h('p', { className: 'dwo-hint dwo-warning' }, t('settings.reloadNew')) : null,
        h('p', { className: 'dwo-hint' }, t('settings.hostRestartHint')),
      )
    }

    // ------------------------------------------------------------------ 自绘侧栏

    function formatRelative(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return ''
      const diff = Date.now() - ms
      if (diff < 60000) return '<1m'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
      try {
        return new Date(ms).toLocaleDateString()
      } catch {
        return ''
      }
    }

    function openMenu(kind, payload, event) {
      const rect =
        event && event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function'
          ? event.currentTarget.getBoundingClientRect()
          : { left: 12, bottom: 72 }
      const maxLeft = Math.max(8, (window.innerWidth || 1024) - 300)
      const maxTop = Math.max(8, (window.innerHeight || 768) - 340)
      // 右键用鼠标坐标，普通点击回退到按钮/行的位置。
      const rawX = typeof event?.clientX === 'number' && event.clientX > 0 ? event.clientX : rect.left
      const rawY = typeof event?.clientY === 'number' && event.clientY > 0 ? event.clientY : rect.bottom + 4
      store.dialog = {
        kind,
        ...payload,
        x: Math.max(8, Math.min(rawX, maxLeft)),
        y: Math.max(8, Math.min(rawY, maxTop)),
      }
      bump()
    }

    let dragging = null

    async function moveRelative(sourceId, targetId, mode) {
      if (!sourceId || !targetId || sourceId === targetId) return
      const sidebar = store.sidebar
      const workspace = (sidebar?.workspaces ?? []).find((row) => row.sessionIds.includes(sourceId))
      if (!workspace) return
      const ids = workspace.sessionIds.filter((id) => id !== sourceId)
      const index = ids.indexOf(targetId)
      if (index < 0) return
      const before = mode === 'after' ? ids[index + 1] : ids[index]
      const workspaces = pluginCtx?.get?.('workspaces')
      if (!workspaces || typeof workspaces.insertSessionBefore !== 'function') return
      applyOrderLocally(workspace.id, sourceId, before)
      setOrderMode('manual')
      beginWrite()
      try {
        await workspaces.insertSessionBefore(workspace.id, sourceId, before)
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
      } catch (error) {
        orderOverrides.delete(workspace.id)
        invalidateSidebar()
        scheduleSidebarRefresh({ debounce: true })
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      } finally {
        endWrite()
      }
    }

    function baseName(path) {
      if (typeof path !== 'string' || path.length === 0) return ''
      const parts = path.split(/[\\/]+/).filter(Boolean)
      return parts.length > 0 ? parts[parts.length - 1] : ''
    }

    function ScheduleIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 12,
          height: 12,
          'aria-hidden': true,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
        },
        h('circle', { cx: 12, cy: 12, r: 8.5 }),
        h('path', { d: 'M12 7.5V12l3 2' }),
      )
    }

    function SessionRow(props) {
      const session = props.session
      const snap = useSnapshot()
      const color = snap.colors[session.id]
      const favorite = snap.favorites.has(session.id)
      const selected = snap.selectedSessionId === session.id
      const archived = session.archived === true
      // 日志定位不到或为空的会话：不响应打开，避免切到空白新会话。
      const broken = session.openable === false
      // 冷会话可能没有标题投影；回退到会话目录名，避免整排「未命名」。
      const folder = baseName(session.cwd)
      const label =
        session.blank === true ? t('sidebar.newSession') : session.title || folder || t('sidebar.untitled')
      // 有活跃定时任务时自己画时钟（与官方 Schedule 标记同样的语义）；
      // 否则渲染官方行前座位（若宿主声明了该子插槽）。
      const scheduleCount = typeof session.scheduleCount === 'number' ? session.scheduleCount : 0
      const leading =
        scheduleCount > 0
          ? h(
              'span',
              { className: 'dwo-schedule-mark', title: t('sidebar.schedules', { count: scheduleCount }) },
              h(ScheduleIcon),
            )
          : safeRenderSlot('sidebar.session.row.leading', { sessionId: session.id })
      // 状态点：运行中蓝色呼吸；完成但未查看绿色常亮；其余为默认空心点。
      const completedAt = typeof session.completedAt === 'number' ? session.completedAt : 0
      const seenAt = (store.seenAt && store.seenAt.get(session.id)) || 0
      const pending = typeof session.pending === 'string' ? session.pending : ''
      // 绿灯由本地 complete 事件计时，不依赖 /sidebar 的 completedAt 回填，
      // 避免刷新耗时吃掉 2 秒窗口。
      const flashing = (completionFlash.get(session.id) ?? 0) > Date.now() || completionSticky.has(session.id)
      const dotState =
        pending === 'plan'
          ? 'plan'
          : pending
            ? 'pending'
            : session.running
              ? 'running'
              : flashing
                ? 'done'
                : 'idle'
      return h(
        'div',
        {
          className: `dwo-srow${selected ? ' dwo-srow-active' : ''}${archived ? ' dwo-srow-archived' : ''}${broken ? ' dwo-srow-broken' : ''}`,
          role: 'button',
          tabIndex: 0,
          title: broken ? `${label}（${t('sidebar.broken')}）` : session.title || session.cwd || label,
          onMouseEnter: (event) => scheduleHover(session.id, event.currentTarget),
          onMouseLeave: hideHover,
          draggable: !archived && !broken,
          onDragStart: (event) => {
            if (archived || broken) return
            dragging = { id: session.id, workspaceId: props.workspaceId }
            try {
              event.dataTransfer.setData('text/plain', session.id)
              event.dataTransfer.effectAllowed = 'move'
            } catch {
              // 某些宿主禁止设置拖拽数据
            }
          },
          onDragOver: (event) => {
            if (!dragging || dragging.id === session.id || archived) return
            event.preventDefault()
            const rect = event.currentTarget.getBoundingClientRect()
            event.currentTarget.dataset.dwoDrop = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before'
          },
          onDragLeave: (event) => {
            delete event.currentTarget.dataset.dwoDrop
          },
          onDrop: (event) => {
            event.preventDefault()
            const mode = event.currentTarget.dataset.dwoDrop === 'after' ? 'after' : 'before'
            delete event.currentTarget.dataset.dwoDrop
            const source = dragging ? dragging.id : ''
            dragging = null
            void moveRelative(source, session.id, mode)
          },
          onDragEnd: () => {
            dragging = null
          },
          onContextMenu: (event) => {
            event.preventDefault()
            hideHover()
            openMenu('sessionMenu', { sessionId: session.id }, event)
          },
          onClick: () => {
            if (!archived && !broken) selectSession(session.id)
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !archived && !broken) selectSession(session.id)
          },
        },
        h('span', { className: 'dwo-srow-leading' }, leading),
        h('span', {
          // 空闲时保留占位（不可见）以保证各行标题对齐；运行时蓝色呼吸、完成未查看绿色常亮。
          className: `dwo-srow-dot${
            dotState === 'pending'
              ? ' dwo-srow-dot-pending'
              : dotState === 'plan'
                ? ' dwo-srow-dot-plan'
                : dotState === 'running'
                  ? ' dwo-srow-dot-running'
                  : dotState === 'done'
                    ? ' dwo-srow-dot-done'
                    : ' dwo-srow-dot-idle'
          }`,
        }),
        h('span', { className: 'dwo-srow-title', style: color ? { color: COLOR_HEX[color] } : undefined }, label),
        h(
          'span',
          {
            className: `dwo-srow-time${
              dotState === 'pending'
                ? ' dwo-srow-time-pending'
                : dotState === 'plan'
                  ? ' dwo-srow-time-plan'
                  : dotState === 'done'
                    ? ' dwo-srow-time-done'
                    : ''
            }`,
          },
          dotState === 'pending'
            ? pending === 'approval'
              ? t('sidebar.pendingApproval')
              : t('sidebar.pendingQuestion')
            : dotState === 'plan'
              ? t('sidebar.pendingPlan')
              : dotState === 'done'
                ? t('sidebar.done')
                : formatRelative(session.updatedAt),
        ),
        h(
          'span',
          { className: 'dwo-srow-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: favorite ? t('fav.remove') : t('fav.add'),
              'aria-label': favorite ? t('fav.remove') : t('fav.add'),
              onClick: (event) => {
                event.stopPropagation()
                void toggleFavoriteById(session.id)
              },
            },
            h(StarIcon, { filled: favorite, size: 13 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: archived ? t('session.unarchive') : t('session.archive'),
              'aria-label': archived ? t('session.unarchive') : t('session.archive'),
              onClick: (event) => {
                event.stopPropagation()
                if (archived) void unarchiveSession(session.id)
                else void archiveSession(session.id)
              },
            },
            archived ? h(RestoreIcon, { size: 13 }) : h(ArchiveIcon, { size: 13 }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: t('session.menu'),
              'aria-label': t('session.menu'),
              onClick: (event) => {
                event.stopPropagation()
                openMenu('sessionMenu', { sessionId: session.id }, event)
              },
            },
            '⋯',
          ),
        ),
      )
    }

    /** 按路径把工作区组织成树：父节点是最近的已注册祖先目录。 */
    function buildWorkspaceTree(workspaces) {
      const nodes = workspaces.map((workspace) => ({ workspace, children: [] }))
      const byPath = new Map()
      for (const node of nodes) {
        const key = String(node.workspace.path || '').toLowerCase().replace(/[\\/]+$/, '')
        if (key) byPath.set(key, node)
      }
      const roots = []
      for (const node of nodes) {
        const path = String(node.workspace.path || '').toLowerCase().replace(/[\\/]+$/, '')
        let parent = null
        let cursor = path
        while (cursor.length > 0) {
          const cut = Math.max(cursor.lastIndexOf('\\'), cursor.lastIndexOf('/'))
          if (cut <= 0) break
          cursor = cursor.slice(0, cut)
          const candidate = byPath.get(cursor)
          if (candidate && candidate !== node) {
            parent = candidate
            break
          }
        }
        if (parent) parent.children.push(node)
        else roots.push(node)
      }
      return roots
    }

    function WorkspaceGroup(props) {
      const workspace = props.workspace
      const rows = props.rows
      const depth = typeof props.depth === 'number' ? props.depth : 0
      const childCount = typeof props.childCount === 'number' ? props.childCount : 0
      const snap = useSnapshot()
      const folded = view.folded[workspace.id] === true
      const color = snap.colors[workspace.id]
      const favorite = snap.workspaceFavorites.has(workspace.id)
      // 括号计数 = 自己的会话 + 直接子工作区数量（不递归统计子文件夹里的会话）。
      const count = rows.length + childCount
      const title = workspace.title || workspace.path || workspace.id
      return h(
        'div',
        { className: 'dwo-group' },
        h(
          'div',
          {
            className: 'dwo-ws',
            style: { paddingLeft: `${4 + depth * 12}px` },
            onDoubleClick: (event) => {
              if (event.target && event.target.closest && event.target.closest('.dwo-ws-fold, .dwo-icon-button')) return
              toggleFold(workspace.id)
            },
            onContextMenu: (event) => {
              event.preventDefault()
              openMenu('workspaceMenu', { workspaceId: workspace.id }, event)
            },
          },
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-ws-fold',
              title: folded ? t('sidebar.rail') : workspace.path || workspace.id,
              onClick: () => toggleFold(workspace.id),
            },
            folded ? '▸' : '▾',
          ),
          color
            ? h('span', {
                className: 'dwo-ws-dot',
                style: { background: COLOR_HEX[color], borderColor: COLOR_HEX[color] },
              })
            : null,
          h('span', { className: 'dwo-ws-title' }, title),
          h('span', { className: 'dwo-ws-count' }, `(${count})`),
          h(
            'span',
            { className: 'dwo-ws-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dwo-icon-button',
                title: favorite ? t('ws.unfavorite') : t('ws.favorite'),
                onClick: () => void toggleWorkspaceFavorite(workspace.id),
              },
              h(StarIcon, { filled: favorite, size: 12 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dwo-icon-button',
                title: t('sidebar.newSession'),
                'aria-label': t('sidebar.newSession'),
                onClick: (event) => {
                  event.stopPropagation()
                  void startSessionInWorkspace(workspace.id)
                },
              },
              h(PlusIcon, { size: 12 }),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dwo-icon-button',
                title: t('session.menu'),
                onClick: (event) => openMenu('workspaceMenu', { workspaceId: workspace.id }, event),
              },
              '⋯',
            ),
          ),
        ),
        folded
          ? null
          : h(
              React.Fragment,
              null,
              props.subGroups ?? null,
              rows.length === 0 && childCount === 0
                ? h('div', { className: 'dwo-group-empty' }, t('sidebar.empty'))
                : rows.length === 0
                  ? null
                  : h(
                      'div',
                      { className: 'dwo-rows', style: { paddingLeft: `${10 + depth * 12}px` } },
                      rows.map((session) => h(SessionRow, { key: session.id, session, workspaceId: workspace.id })),
                    ),
            ),
      )
    }

    function SidebarBrowser(props) {
      const snap = useSnapshot()
      const wide = props.wide !== false

      React.useEffect(() => {
        if (!store.sidebar && !store.sidebarLoading) refreshSidebar()
      }, [])

      if (!wide) {
        return h(
          'button',
          {
            type: 'button',
            className: 'dwo-rail-button',
            title: t('sidebar.rail'),
            onClick: () => props.expandSidebar && props.expandSidebar(),
          },
          '≡',
        )
      }

      const sidebar = snap.sidebar
      const sessions = Array.isArray(sidebar?.sessions) ? sidebar.sessions : []
      const byId = new Map(sessions.map((session) => [session.id, session]))
      const query = (view.search || '').trim().toLowerCase()
      const keep = (session) => {
        if (view.filter === 'hide' && session.archived) return false
        if (view.filter === 'only' && !session.archived) return false
        if (query && !String(session.title || '').toLowerCase().includes(query)) return false
        return true
      }
      const sortRows = (ids) => {
        const rows = ids
          .map((id) => byId.get(id))
          .filter(Boolean)
          .filter(keep)
        if (view.order === 'manual') {
          const index = new Map(ids.map((id, position) => [id, position]))
          rows.sort((a, b) => (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0))
        } else {
          rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        }
        return rows
      }
      const workspaceList = Array.isArray(sidebar?.workspaces) ? sidebar.workspaces : []
      const groups = workspaceList.map((workspace) => ({
        workspace,
        rows: sortRows(workspace.sessionIds),
      }))
      const total = groups.reduce((sum, group) => sum + group.rows.length, 0)
      const renderTree = (nodes, depth) =>
        nodes.map((node) => {
          const rows = sortRows(node.workspace.sessionIds)
          const subGroups =
            node.children.length > 0 ? h(React.Fragment, null, renderTree(node.children, depth + 1)) : null
          return h(WorkspaceGroup, {
            key: node.workspace.id,
            workspace: node.workspace,
            rows,
            depth,
            childCount: node.children.length,
            subGroups,
          })
        })

      return h(
        'div',
        { className: 'dwo-sidebar' },
        h(
          'div',
          { className: 'dwo-sidebar-head' },
          h('span', { className: 'dwo-sidebar-title' }, t('sidebar.title')),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: t('sidebar.newSession'),
              onClick: () => startSession(groups[0]?.workspace.id),
            },
            '+',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: t('favorites.title'),
              onClick: () => openDialog({ kind: 'favorites' }),
            },
            '★',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: t('view.options'),
              onClick: (event) => openMenu('viewOptions', {}, event),
            },
            '☰',
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dwo-icon-button',
              title: t('sidebar.refresh'),
              onClick: () => void refreshSidebar(),
            },
            '⟳',
          ),
        ),
        h('input', {
          className: 'dwo-search',
          type: 'search',
          value: view.search,
          placeholder: t('sidebar.search'),
          onChange: (event) => {
            view.search = event.target.value
            bump()
            scheduleSearch(event.target.value)
          },
        }),
        snap.search && snap.search.query === view.search.trim() && snap.search.items.length > 0
          ? h(
              'div',
              { className: 'dwo-search-results' },
              h('div', { className: 'dwo-search-heading' }, `${t('search.results')} ${snap.search.items.length}`),
              snap.search.items.map((hit) =>
                h(
                  'button',
                  {
                    key: hit.id,
                    type: 'button',
                    className: 'dwo-search-hit',
                    title: hit.snippet || hit.id,
                    onClick: () => selectSession(hit.id),
                  },
                  h('span', { className: 'dwo-search-hit-title' }, hit.title || hit.snippet || hit.id.slice(0, 8)),
                  hit.snippet ? h('span', { className: 'dwo-search-hit-snippet' }, hit.snippet) : null,
                ),
              ),
            )
          : null,
        snap.search && snap.search.error ? h('div', { className: 'dwo-sidebar-error' }, snap.search.error) : null,
        snap.sidebarError
          ? h('div', { className: 'dwo-sidebar-error' }, snap.sidebarError)
          : null,
        sidebar === null
          ? h('div', { className: 'dwo-group-empty' }, t('sidebar.loading'))
          : h(
              'div',
              { className: 'dwo-groups' },
              view.groupBy === 'tree'
                ? renderTree(buildWorkspaceTree(workspaceList), 0)
                : groups.map((group) => h(WorkspaceGroup, { key: group.workspace.id, workspace: group.workspace, rows: group.rows })),
              total === 0 && query ? h('div', { className: 'dwo-group-empty' }, t('sidebar.empty')) : null,
            ),
        h(
          'div',
          { className: 'dwo-sidebar-foot' },
          h('button', { type: 'button', className: 'dwo-text-button', onClick: () => void createWorkspace() }, t('sidebar.addWorkspace')),
        ),
        snap.hover
          ? (() => {
              const session = byId.get(snap.hover.sessionId)
              if (!session) return null
              const meta = [
                session.pending === 'approval'
                  ? t('sidebar.pendingApproval')
                  : session.pending === 'plan'
                    ? t('sidebar.pendingPlan')
                    : session.pending === 'question'
                      ? t('sidebar.pendingQuestion')
                      : '',
                session.running ? t('sidebar.running') : '',
                session.scheduleCount > 0 ? t('sidebar.schedules', { count: session.scheduleCount }) : '',
                session.archived ? t('sidebar.archived') : '',
                session.openable === false ? t('sidebar.broken') : '',
              ]
                .filter(Boolean)
                .join(' · ')
              return h(
                'div',
                { className: 'dwo-hovercard', style: { left: `${snap.hover.x}px`, top: `${snap.hover.y}px` } },
                h(
                  'div',
                  { className: 'dwo-hovercard-title' },
                  session.title || baseName(session.cwd) || t('sidebar.untitled'),
                ),
                session.cwd ? h('div', { className: 'dwo-hovercard-meta' }, session.cwd) : null,
                meta ? h('div', { className: 'dwo-hovercard-meta' }, meta) : null,
                session.updatedAt
                  ? h('div', { className: 'dwo-hovercard-meta' }, new Date(session.updatedAt).toLocaleString())
                  : null,
                h(
                  'div',
                  { className: 'dwo-hovercard-slot' },
                  safeRenderSlot('sidebar.session.row.hover', { sessionId: session.id }),
                ),
              )
            })()
          : null,
      )
    }

    class SidebarBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error) {
        try {
          console.error('[workspace-optimize] sidebar crashed', error)
        } catch {
          // 控制台不可用时只显示错误文本
        }
      }

      render() {
        if (this.state.error) {
          return h(
            'div',
            { className: 'dwo-sidebar-error' },
            `侧栏渲染失败：${String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}`,
          )
        }
        return this.props.children
      }
    }

    let sidebarSlots = null

    /** 渲染本组件声明的子插槽；签名不符或贡献抛错时只降级，不影响自绘侧栏。 */
    function safeRenderSlot(key, owner) {
      try {
        if (!sidebarSlots || typeof sidebarSlots.renderSlot !== 'function') return null
        return sidebarSlots.renderSlot(key, owner)
      } catch (error) {
        try {
          console.warn('[workspace-optimize] renderSlot failed', key, error)
        } catch {
          // 控制台不可用
        }
        return null
      }
    }

    function SidebarRoot(props) {
      sidebarSlots = props
      return h(SidebarBoundary, null, h(SidebarBrowser, props))
    }

    function MenuPopover(props) {
      return h(
        'div',
        {
          className: 'dwo-overlay dwo-overlay-clear',
          role: 'presentation',
          onClick: (event) => {
            if (event.target === event.currentTarget) closeDialog()
          },
        },
        h(
          'div',
          {
            className: 'dwo-popover',
            role: 'menu',
            style: { left: `${props.x}px`, top: `${props.y}px` },
            onClick: (event) => event.stopPropagation(),
          },
          props.items.map((item, index) =>
            item.separator
              ? h('div', { key: `sep-${index}`, className: 'dwo-menu-separator' })
              : h(
                  'button',
                  {
                    key: `${index}-${item.label}`,
                    type: 'button',
                    role: 'menuitem',
                    className: 'dwo-menu-item',
                    disabled: item.disabled === true,
                    onClick: () => item.run(),
                  },
                  h('span', { className: 'dwo-check' }, item.checked ? '✓' : ''),
                  h('span', { className: 'dwo-menu-label' }, item.label),
                ),
          ),
        ),
      )
    }

    function PromptDialog(props) {
      const [value, setValue] = React.useState(props.value || '')
      const submit = () => {
        const next = value.trim()
        if (next) props.onSubmit(next)
        closeDialog()
      }
      return h(
        DialogShell,
        { title: props.title },
        h('input', {
          className: 'dwo-input',
          value,
          autoFocus: true,
          onChange: (event) => setValue(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter') submit()
          },
        }),
        h(
          'div',
          { className: 'dwo-dialog-actions' },
          h('button', { type: 'button', className: 'dwo-button', onClick: submit }, t('common.ok')),
          h('button', { type: 'button', className: 'dwo-button', onClick: closeDialog }, t('common.cancel')),
        ),
      )
    }

    function menuItemsFor(dialog, snap) {
      if (!dialog) return []
      if (dialog.kind === 'viewOptions') {
        return [
          { label: t('view.group.flat'), checked: view.groupBy !== 'tree', run: () => { setGroupBy('flat'); closeDialog() } },
          { label: t('view.group.tree'), checked: view.groupBy === 'tree', run: () => { setGroupBy('tree'); closeDialog() } },
          { separator: true },
          { label: t('view.order.updated'), checked: view.order === 'updated', run: () => { setOrderMode('updated'); closeDialog() } },
          { label: t('view.order.manual'), checked: view.order === 'manual', run: () => { setOrderMode('manual'); closeDialog() } },
          { separator: true },
          { label: t('view.filter.hide'), checked: view.filter === 'hide', run: () => { setArchivedFilter('hide'); closeDialog() } },
          { label: t('view.filter.show'), checked: view.filter === 'show', run: () => { setArchivedFilter('show'); closeDialog() } },
          { label: t('view.filter.only'), checked: view.filter === 'only', run: () => { setArchivedFilter('only'); closeDialog() } },
        ]
      }
      if (dialog.kind === 'sessionMenu') {
        const sessionId = dialog.sessionId
        const session = (snap.sidebar?.sessions ?? []).find((row) => row.id === sessionId)
        const favorite = snap.favorites.has(sessionId)
        const pinned = isPinned(sessionId)
        const items = [
          { label: favorite ? t('fav.remove') : t('fav.add'), run: () => { closeDialog(); void toggleFavoriteById(sessionId) } },
          { label: t('session.color'), run: () => openDialog({ kind: 'color', sessionId }) },
          { label: t('session.rename'), run: () => openDialog({ kind: 'renameSession', sessionId, value: session?.title || '' }) },
          { label: pinned ? t('session.unpin') : t('session.pin'), run: () => { closeDialog(); void togglePinned(sessionId) } },
          { label: t('session.copyId'), run: () => { closeDialog(); void copySessionId(sessionId) } },
        ]
        if (snap.capabilities?.move === true) {
          items.push({ label: t('session.move'), run: () => openDialog({ kind: 'move', sessionId }) })
        }
        let orderIndex = (session && snap.sidebar) ? (snap.sidebar.workspaces.find((w) => w.sessionIds.includes(sessionId))?.sessionIds ?? []).indexOf(sessionId) : -1
        if (orderIndex >= 0) {
          items.push({ label: t('order.top'), run: () => { closeDialog(); void applyOrder(sessionId, 'top') } })
          items.push({ label: t('order.up'), run: () => { closeDialog(); void applyOrder(sessionId, 'up') } })
          items.push({ label: t('order.down'), run: () => { closeDialog(); void applyOrder(sessionId, 'down') } })
          items.push({ label: t('order.bottom'), run: () => { closeDialog(); void applyOrder(sessionId, 'bottom') } })
        }
        if (session?.archived) items.push({ label: t('session.unarchive'), run: () => { closeDialog(); void unarchiveSession(sessionId) } })
        else items.push({ label: t('session.archive'), run: () => { closeDialog(); void archiveSession(sessionId) } })
        return items
      }
      if (dialog.kind === 'workspaceMenu') {
        const workspaceId = dialog.workspaceId
        const workspace = (snap.sidebar?.workspaces ?? []).find((row) => row.id === workspaceId)
        const favorite = snap.workspaceFavorites.has(workspaceId)
        return [
          { label: favorite ? t('ws.unfavorite') : t('ws.favorite'), run: () => { closeDialog(); void toggleWorkspaceFavorite(workspaceId) } },
          { label: t('ws.color'), run: () => openDialog({ kind: 'color', sessionId: workspaceId }) },
          { label: t('ws.newSession'), run: () => { closeDialog(); startSession(workspaceId) } },
          { label: t('ws.rename'), run: () => openDialog({ kind: 'renameWorkspace', workspaceId, value: workspace?.title || '' }) },
        ]
      }
      return []
    }

    function FavoritesPanel() {
      const snap = useSnapshot()
      const sidebar = snap.sidebar
      const sessions = Array.isArray(sidebar?.sessions) ? sidebar.sessions : []
      const favoriteSessions = sessions.filter((session) => snap.favorites.has(session.id))
      const favoriteWorkspaces = (Array.isArray(sidebar?.workspaces) ? sidebar.workspaces : []).filter((workspace) =>
        snap.workspaceFavorites.has(workspace.id),
      )

      return h(
        DialogShell,
        { title: t('favorites.title') },
        favoriteSessions.length === 0 && favoriteWorkspaces.length === 0
          ? h('p', { className: 'dwo-hint' }, t('favorites.empty'))
          : h(
              React.Fragment,
              null,
              favoriteSessions.length > 0
                ? h(
                    'div',
                    { className: 'dwo-fav-section' },
                    h('div', { className: 'dwo-section-title' }, t('favorites.sessions')),
                    favoriteSessions.map((session) =>
                      h(
                        'button',
                        {
                          key: session.id,
                          type: 'button',
                          className: 'dwo-search-hit',
                          onClick: () => {
                            closeDialog()
                            selectSession(session.id)
                          },
                        },
                        h(
                          'span',
                          { className: 'dwo-search-hit-title' },
                          session.title || baseName(session.cwd) || t('sidebar.untitled'),
                        ),
                        session.cwd
                          ? h('span', { className: 'dwo-search-hit-snippet' }, session.cwd)
                          : null,
                      ),
                    ),
                  )
                : null,
              favoriteWorkspaces.length > 0
                ? h(
                    'div',
                    { className: 'dwo-fav-section' },
                    h('div', { className: 'dwo-section-title' }, t('favorites.workspaces')),
                    favoriteWorkspaces.map((workspace) =>
                      h(
                        'div',
                        { key: workspace.id, className: 'dwo-hint' },
                        workspace.title || workspace.path || workspace.id,
                      ),
                    ),
                  )
                : null,
            ),
      )
    }

    function Surfaces() {
      const snap = useSnapshot()
      const dialog = snap.dialog
      const toast = snap.toast

      let surface = null
      if (dialog) {
        if (dialog.kind === 'color') {
          surface = h(ColorPicker, { sessionId: dialog.sessionId, current: snap.colors[dialog.sessionId] })
        } else if (dialog.kind === 'order') {
          surface = h(OrderPicker, { sessionId: dialog.sessionId })
        } else if (dialog.kind === 'move') {
          surface = h(MovePicker, { sessionId: dialog.sessionId })
        } else if (dialog.kind === 'sessionMenu' || dialog.kind === 'workspaceMenu' || dialog.kind === 'viewOptions') {
          surface = h(MenuPopover, { items: menuItemsFor(dialog, snap), x: dialog.x, y: dialog.y })
        } else if (dialog.kind === 'renameSession') {
          surface = h(PromptDialog, {
            title: t('session.rename'),
            value: dialog.value,
            onSubmit: (value) => void renameSession(dialog.sessionId, value),
          })
        } else if (dialog.kind === 'renameWorkspace') {
          surface = h(PromptDialog, {
            title: t('ws.rename'),
            value: dialog.value,
            onSubmit: (value) => void renameWorkspace(dialog.workspaceId, value),
          })
        } else if (dialog.kind === 'favorites') {
          surface = h(FavoritesPanel)
        } else if (dialog.kind === 'settings') {
          surface = h(DialogShell, { title: t('settings.title') }, h(SettingsForm))
        }
      }

      return h(
        React.Fragment,
        null,
        surface,
        toast
          ? h('div', { className: 'dwo-toast', role: 'status', key: toast.id }, toast.text)
          : null,
      )
    }

    function SettingsSection() {
      return h(SettingsForm)
    }

    // ------------------------------------------------------------------ 样式

    const CSS = `
.dwo-menu-item{display:flex;align-items:center;gap:6px;width:100%;min-height:30px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:13px;text-align:left;cursor:pointer}
.dwo-menu-item:hover:not(:disabled){background:color-mix(in srgb,currentColor 10%,transparent)}
.dwo-menu-item:disabled{opacity:.45;cursor:not-allowed}
.dwo-menu-item svg{flex:0 0 auto;opacity:.8}
.dwo-row-action{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:transparent;color:inherit;cursor:pointer;opacity:.72}
.dwo-row-action:hover{background:color-mix(in srgb,currentColor 14%,transparent);opacity:1}
.dwo-mark{display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;border-radius:50%;color:#fff;box-shadow:0 0 0 1px color-mix(in srgb,currentColor 22%,transparent)}
.dwo-hover{display:flex;gap:6px;font-size:11px;line-height:16px;opacity:.78}
.dwo-overlay{position:fixed;inset:0;z-index:2147482000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.38);pointer-events:auto}
.dwo-dialog{width:min(440px,calc(100vw - 48px));max-height:calc(100vh - 96px);overflow:auto;border-radius:14px;padding:16px 18px 18px;background:var(--dsw-alias-bg-elevated,#20242e);color:var(--dsw-alias-label-primary,#e8eaf0);border:1px solid color-mix(in srgb,currentColor 12%,transparent);box-shadow:0 22px 56px rgba(0,0,0,.42);font-size:13px}
.dwo-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.dwo-dialog-title{font-size:15px;font-weight:600}
.dwo-dialog-body{display:flex;flex-direction:column;gap:12px}
.dwo-icon-button{width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:inherit;font-size:18px;line-height:1;cursor:pointer;opacity:.7}
.dwo-icon-button:hover{background:color-mix(in srgb,currentColor 12%,transparent);opacity:1}
.dwo-swatches{display:grid;grid-template-columns:repeat(9,1fr);gap:8px}
.dwo-swatch{width:100%;aspect-ratio:1;border:2px solid transparent;border-radius:50%;cursor:pointer;padding:0}
.dwo-swatch-active{border-color:currentColor;box-shadow:0 0 0 2px color-mix(in srgb,currentColor 24%,transparent)}
.dwo-dialog-actions{display:flex;flex-direction:column;gap:12px}
.dwo-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:0 12px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}
.dwo-button:hover:not(:disabled){background:color-mix(in srgb,currentColor 10%,transparent)}
.dwo-button:disabled{opacity:.5;cursor:not-allowed}
.dwo-button-primary{background:#2f6fed;border-color:transparent;color:#fff}
.dwo-section-title{margin-top:10px;padding-top:10px;border-top:1px solid color-mix(in srgb,currentColor 10%,transparent);font-size:12px;font-weight:600;opacity:.75}
.dwo-button-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dwo-hint{margin:0;font-size:11.5px;line-height:18px;opacity:.66}
.dwo-warning{color:#f59e0b;opacity:.9}
.dwo-priority-row{display:flex;align-items:center;gap:10px}
.dwo-label{font-size:11.5px;opacity:.7;white-space:nowrap}
.dwo-range{flex:1 1 auto;min-width:120px;accent-color:currentColor}
.dwo-workspace-list{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto}
.dwo-workspace-row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;padding:8px 10px;border:1px solid color-mix(in srgb,currentColor 12%,transparent);border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dwo-workspace-row:hover:not(:disabled){background:color-mix(in srgb,currentColor 9%,transparent)}
.dwo-workspace-row:disabled{opacity:.55;cursor:progress}
.dwo-workspace-title{font-size:12.5px}
.dwo-workspace-path{font-size:10.5px;opacity:.55;word-break:break-all}
.dwo-toast{position:fixed;left:50%;bottom:32px;z-index:2147482100;transform:translateX(-50%);max-width:min(560px,calc(100vw - 48px));padding:9px 14px;border-radius:10px;background:var(--dsw-alias-bg-elevated,#20242e);color:var(--dsw-alias-label-primary,#e8eaf0);border:1px solid color-mix(in srgb,currentColor 14%,transparent);box-shadow:0 12px 30px rgba(0,0,0,.35);font-size:12.5px;line-height:18px;pointer-events:auto}
.dwo-settings{display:flex;flex-direction:column;gap:2px;width:100%}
.dwo-setting-row{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 2px;border-bottom:1px solid color-mix(in srgb,currentColor 8%,transparent)}
.dwo-setting-row:last-child{border-bottom:0}
.dwo-setting-label{flex:1 1 auto;font-size:13px}
.dwo-toggle{position:relative;flex:0 0 auto;width:38px;height:22px;padding:0;border:0;border-radius:999px;background:color-mix(in srgb,currentColor 24%,transparent);cursor:pointer;transition:background .15s ease}
.dwo-toggle-on{background:#2f6fed}
.dwo-toggle-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s ease}
.dwo-toggle-on .dwo-toggle-knob{transform:translateX(16px)}
.dwo-time{padding:3px 6px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:6px;background:transparent;color:inherit;font:inherit;font-size:12px}
.dwo-sidebar{display:flex;flex-direction:column;gap:6px;min-width:0;width:100%;height:100%;padding:6px 4px 10px;box-sizing:border-box;color:var(--dsw-alias-label-primary,inherit)}
.dwo-sidebar-head{display:flex;align-items:center;gap:2px;padding:2px 4px}
.dwo-sidebar-title{flex:1 1 auto;font-size:12.5px;font-weight:600;letter-spacing:.01em;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dwo-search{width:100%;box-sizing:border-box;margin:0 4px;padding:4px 8px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:7px;background:color-mix(in srgb,currentColor 4%,transparent);color:inherit;font:inherit;font-size:12px;outline:none}
.dwo-search:focus{border-color:color-mix(in srgb,currentColor 32%,transparent)}
.dwo-sidebar-error{margin:0 6px;padding:5px 8px;border-radius:6px;background:color-mix(in srgb,#f59e0b 16%,transparent);font-size:11px;line-height:15px;word-break:break-word}
.dwo-search-results{display:flex;flex-direction:column;gap:1px;margin:2px 4px 4px;padding:4px;border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);max-height:240px;overflow:auto}
.dwo-search-heading{font-size:10.5px;opacity:.5;padding:2px 4px 4px}
.dwo-search-hit{display:flex;flex-direction:column;align-items:flex-start;gap:1px;width:100%;padding:4px 6px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dwo-search-hit:hover{background:color-mix(in srgb,currentColor 9%,transparent)}
.dwo-search-hit-title{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.dwo-search-hit-snippet{font-size:10.5px;opacity:.55;line-height:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dwo-hovercard{position:fixed;z-index:2147481900;width:280px;max-width:calc(100vw - 32px);display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-elevated,#20242e);color:var(--dsw-alias-label-primary,#e8eaf0);border:1px solid color-mix(in srgb,currentColor 14%,transparent);box-shadow:0 14px 34px rgba(0,0,0,.4);pointer-events:none;font-size:12px;line-height:17px}
.dwo-hovercard-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dwo-hovercard-meta{font-size:11px;opacity:.62;word-break:break-all}
.dwo-hovercard-slot:empty{display:none}
.dwo-groups{display:flex;flex-direction:column;gap:2px;overflow:auto;flex:1 1 auto;min-height:0;padding:0 2px}
.dwo-group{display:flex;flex-direction:column;gap:1px}
.dwo-ws{display:flex;align-items:center;gap:4px;min-height:26px;padding:1px 4px;border-radius:6px}
.dwo-ws:hover{background:color-mix(in srgb,currentColor 7%,transparent)}
.dwo-ws-fold{width:16px;height:20px;padding:0;border:0;background:transparent;color:inherit;font-size:10px;cursor:pointer;opacity:.7;flex:0 0 auto}
.dwo-ws-dot{width:6px;height:6px;border-radius:50%;box-sizing:border-box;flex:0 0 auto}
.dwo-ws-title{flex:0 1 auto;min-width:0;font-size:12px;font-weight:560;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dwo-ws-count{flex:0 0 auto;font-size:10.5px;opacity:.5}
.dwo-ws-actions{display:flex;align-items:center;gap:1px;margin-left:auto;flex:0 0 auto;opacity:0;transition:opacity .12s ease}
.dwo-srow-actions{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:1px;opacity:0;pointer-events:none;transition:opacity .12s ease}
.dwo-ws:hover .dwo-ws-actions,.dwo-srow:hover .dwo-srow-actions{opacity:1}
.dwo-srow:hover .dwo-srow-actions{pointer-events:auto}
.dwo-srow:hover .dwo-srow-time{opacity:0}
/* 悬停时给标题右侧留出按钮位置，避免按钮叠在文字上 */
.dwo-srow:hover .dwo-srow-title{padding-right:56px}
.dwo-rows{display:flex;flex-direction:column;gap:1px;padding-left:10px}
.dwo-srow{position:relative;display:flex;align-items:center;gap:6px;min-height:27px;padding:1px 4px 1px 6px;border-radius:6px;cursor:pointer;outline:none}
.dwo-srow:hover{background:color-mix(in srgb,currentColor 8%,transparent)}
.dwo-srow:focus-visible{box-shadow:0 0 0 1px color-mix(in srgb,currentColor 32%,transparent)}
.dwo-srow-active{background:color-mix(in srgb,currentColor 13%,transparent)}
.dwo-srow-archived{opacity:.55}
.dwo-srow-archived .dwo-srow-title{text-decoration:line-through}
.dwo-srow-broken{opacity:.42;cursor:default}
.dwo-srow-broken .dwo-srow-title{text-decoration:line-through}
.dwo-srow[data-dwo-drop="before"]{box-shadow:inset 0 2px 0 #60a5fa}
.dwo-srow[data-dwo-drop="after"]{box-shadow:inset 0 -2px 0 #60a5fa}
.dwo-srow-dot{width:6px;height:6px;border-radius:50%;box-sizing:border-box;flex:0 0 auto}
.dwo-srow-dot-idle{background:transparent}
.dwo-srow-leading{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;color:inherit;opacity:.75}
.dwo-srow-leading:empty{display:none}
.dwo-schedule-mark{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;flex:0 0 auto;color:#60a5fa}
.dwo-srow-dot-running{background:#60a5fa;animation:dwo-pulse 1.2s ease-in-out infinite}
.dwo-srow-dot-pending{background:#fbbf24;animation:dwo-pulse 1.2s ease-in-out infinite}
.dwo-srow-dot-plan{background:#fb923c;animation:dwo-pulse 1.2s ease-in-out infinite}
.dwo-srow-dot-done{background:#34d399}
@keyframes dwo-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.dwo-srow-title{flex:1 1 auto;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dwo-srow-time{font-size:10.5px;opacity:.45;flex:0 0 auto;margin-left:auto;padding-left:6px}
.dwo-srow-time-pending{color:#fbbf24;opacity:1}
.dwo-srow-time-plan{color:#fb923c;opacity:1}
.dwo-srow-time-done{color:#34d399;opacity:1}
.dwo-srow-running{width:6px;height:6px;border-radius:50%;background:#34d399;flex:0 0 auto}
.dwo-group-empty{padding:8px 10px;font-size:11.5px;opacity:.5}
.dwo-sidebar-foot{display:flex;padding:2px 6px 0;border-top:1px solid color-mix(in srgb,currentColor 8%,transparent);padding-top:6px}
.dwo-text-button{padding:2px 4px;border:0;background:transparent;color:inherit;font:inherit;font-size:11.5px;opacity:.65;cursor:pointer;text-align:left}
.dwo-text-button:hover{opacity:1;text-decoration:underline}
.dwo-rail-button{display:flex;align-items:center;justify-content:center;width:36px;height:36px;margin:4px auto;border:0;border-radius:8px;background:transparent;color:inherit;font-size:15px;cursor:pointer}
.dwo-rail-button:hover{background:color-mix(in srgb,currentColor 10%,transparent)}
.dwo-overlay-clear{background:transparent}
.dwo-popover{position:fixed;z-index:2147482000;min-width:200px;max-width:280px;max-height:340px;overflow:auto;display:flex;flex-direction:column;gap:1px;padding:5px;border-radius:10px;background:var(--dsw-alias-bg-elevated,#20242e);color:var(--dsw-alias-label-primary,#e8eaf0);border:1px solid color-mix(in srgb,currentColor 14%,transparent);box-shadow:0 16px 38px rgba(0,0,0,.4)}
.dwo-check{width:14px;display:inline-block;text-align:center;opacity:.85;flex:0 0 auto}
.dwo-menu-label{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dwo-menu-separator{height:1px;margin:4px 6px;background:color-mix(in srgb,currentColor 12%,transparent)}
.dwo-input{width:100%;box-sizing:border-box;padding:6px 9px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:7px;background:transparent;color:inherit;font:inherit;font-size:13px;outline:none}
.dwo-input:focus{border-color:color-mix(in srgb,currentColor 38%,transparent)}
`

    function installStyles() {
      const existing = document.getElementById('dwo-styles')
      if (existing) return () => {}
      const element = document.createElement('style')
      element.id = 'dwo-styles'
      element.textContent = CSS
      document.head.appendChild(element)
      return () => element.remove()
    }

    // ------------------------------------------------------------------ 插件入口

    function apply(ctx) {
      pluginCtx = ctx

      try {
        localeId = ctx.locale?.getLocale?.()?.id ?? 'zh'
      } catch {
        localeId = 'zh'
      }

      const disposers = []
      disposers.push(installStyles())

      try {
        const off = ctx.on('locale/change', (snapshot) => {
          if (snapshot && typeof snapshot.id === 'string') localeId = snapshot.id
          bump()
        })
        disposers.push(() => off?.())
      } catch {
        // 没有 locale 事件时只影响文案跟随，不阻断
      }

      const register = (slot, entry, component) => {
        try {
          const dispose = ctx.slots.inject(slot, () =>
            ctx.slots.register(
              {
                name: slot,
                ...entry,
              },
              component,
            ),
          )
          disposers.push(() => dispose?.())
        } catch (error) {
          try {
            ctx.logger?.warn?.(`workspace-optimize: 注册插槽 ${slot} 失败：${String(error)}`)
          } catch {
            // 忽略
          }
        }
      }

      register('sidebar.workspaces.session.menu.item', { id: 'workspace-optimize.favorite', order: 60 }, FavoriteMenuItem)
      register('sidebar.workspaces.session.menu.item', { id: 'workspace-optimize.color', order: 70 }, ColorMenuItem)
      register('sidebar.workspaces.session.menu.item', { id: 'workspace-optimize.order', order: 80 }, OrderMenuItem)
      register('sidebar.workspaces.session.menu.item', { id: 'workspace-optimize.move', order: 90 }, MoveMenuItem)
      register('sidebar.workspaces.session.row.action', { id: 'workspace-optimize.favorite', order: 210 }, FavoriteRowAction)
      register('sidebar.session.row.leading', { id: 'workspace-optimize.mark', order: 10 }, RowMark)
      register('sidebar.session.row.hover', { id: 'workspace-optimize.hover', order: 10 }, HoverInfo)
      register('shell.overlay', { id: 'workspace-optimize.surfaces', order: 60 }, Surfaces)
      register('settings.section', { id: 'workspace-optimize', order: 80, label: () => t('settings.title') }, SettingsSection)

      // 侧栏替换：只有 sidebarMode 为 optimized 时才占用 sidebar.workspaces，
      // 切回 native 时释放插槽，官方 WorkspaceBrowser 自动恢复。
      let disposeBrowser = null
      const syncSidebarMode = () => {
        const optimized = store.settings.sidebarMode !== 'native'
        if (optimized && !disposeBrowser) {
          try {
            disposeBrowser = ctx.slots.inject('sidebar.workspaces', () =>
              // single 槽位按 priority 升序取第一个生效者；官方 occupant 是 0，
              // 所以覆盖必须用更小的值。
              ctx.slots.register(
                {
                  name: 'sidebar.workspaces',
                  priority: -1,
                },
                SidebarRoot,
              ),
            )
          } catch (error) {
            try {
              ctx.logger?.warn?.(`workspace-optimize: 替换侧栏失败：${String(error)}`)
            } catch {
              // 忽略
            }
            disposeBrowser = null
          }
        } else if (!optimized && disposeBrowser) {
          try {
            disposeBrowser()
          } catch {
            // 已释放
          }
          disposeBrowser = null
        }
      }
      sidebarModeSync = syncSidebarMode
      // 不在 apply 时预注册：single 槽位的覆盖会移除官方 entry，不可撤销。
      // 只有 /state 明确返回 optimized 后才由 adoptState 触发注册。
      disposers.push(() => {
        if (disposeBrowser) {
          try {
            disposeBrowser()
          } catch {
            // 已释放
          }
          disposeBrowser = null
        }
        if (sidebarModeSync === syncSidebarMode) sidebarModeSync = null
      })

      refreshState().catch(() => {})
      connectChannel()

      const onVisibility = () => {
        if (document.visibilityState === 'visible') refreshState().catch(() => {})
      }
      document.addEventListener('visibilitychange', onVisibility)
      disposers.push(() => document.removeEventListener('visibilitychange', onVisibility))

      ctx.effect(
        () => () => {
          disconnectChannel()
          if (toastTimer) clearTimeout(toastTimer)
          for (const dispose of disposers.splice(0)) {
            try {
              dispose()
            } catch {
              // 清理失败不阻断其它清理
            }
          }
        },
        'workspace-optimize: client resources',
      )
    }

    function SettingsMenuItem() {
      return null
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    }
  },
})
