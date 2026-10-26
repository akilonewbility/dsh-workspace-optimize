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
    let version = 0
    const cache = { version: -1, value: null }

    const store = {
      ready: false,
      revision: 0,
      colors: {},
      priorities: {},
      favorites: new Set(),
      settings: {
        enabled: true,
        notify: { complete: true, waiting: true, error: true, started: false },
        notifyWhenVisible: false,
        dnd: { enabled: false, start: '23:00', end: '08:00' },
      },
      capabilities: {},
      stateFile: '',
      dialog: null,
      toast: null,
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
          settings: store.settings,
          capabilities: store.capabilities,
          stateFile: store.stateFile,
          dialog: store.dialog,
          toast: store.toast,
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
      if (data.settings && typeof data.settings === 'object') store.settings = data.settings
      store.capabilities = data.capabilities && typeof data.capabilities === 'object' ? data.capabilities : {}
      store.stateFile = typeof data.stateFile === 'string' ? data.stateFile : ''
      store.revision = typeof data.revision === 'number' ? data.revision : store.revision
      store.ready = true
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
        await workspaces.insertSessionBefore(target.workspaceId, target.sessionId, target.beforeSessionId)
        pushToast(t('toast.orderDone'))
        closeDialog()
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
      try {
        await apiFetch('move', {
          method: 'POST',
          body: JSON.stringify({ sessionId, targetWorkspaceId }),
        })
        pushToast(t('toast.moveDone'))
        closeDialog()
      } catch (error) {
        pushToast(`${t('toast.failed')}：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    async function updateSettings(patch) {
      try {
        const data = await apiFetch('settings', { method: 'POST', body: JSON.stringify(patch) })
        if (data.settings) store.settings = data.settings
        bump()
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
      const title = t(`notify.${event.kind}`)
      const body = event.title || (typeof event.sessionId === 'string' ? event.sessionId.slice(0, 8) : '')
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

      const rows = [
        ['settings.enabled', settings.enabled !== false, (value) => updateSettings({ enabled: value })],
        ['settings.notify.complete', notify.complete === true, (value) => updateSettings({ notify: { complete: value } })],
        ['settings.notify.waiting', notify.waiting === true, (value) => updateSettings({ notify: { waiting: value } })],
        ['settings.notify.error', notify.error === true, (value) => updateSettings({ notify: { error: value } })],
        ['settings.notify.started', notify.started === true, (value) => updateSettings({ notify: { started: value } })],
        ['settings.notifyWhenVisible', settings.notifyWhenVisible === true, (value) => updateSettings({ notifyWhenVisible: value })],
        ['settings.dnd', dnd.enabled === true, (value) => updateSettings({ dnd: { enabled: value } })],
      ]

      return h(
        'div',
        { className: 'dwo-settings' },
        snap.ready ? null : h('p', { className: 'dwo-hint dwo-warning' }, t('settings.unavailable')),
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
