/**
 * 插件自有状态的读取、校验与持久化。
 *
 * 设计取舍：使用 Host 侧一个 JSON 文件保存颜色/优先级/设置/自建收藏。
 * 不依赖 storageDomain（需要 import 官方包并构造 DomainSpec，版本耦合更大），
 * 文件很小、可直接备份与导出；与 archive-manager 在 session-move 中直接用
 * node:fs 的做法一致。
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

/** 允许的颜色标识；前端按同一表渲染色板。 */
export const COLORS = ['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'pink', 'gray']

const MAX_FAVORITES = 100000
const MAX_EVENTS = 200
const MAX_ID_LENGTH = 1024

export const DEFAULT_SETTINGS = {
  enabled: true,
  sidebarMode: 'optimized',
  showBlankSessions: false,
  workspaceHighlight: false,
  notify: { complete: true, waiting: true, error: true, started: false },
  notifyWhenVisible: false,
  dnd: { enabled: false, start: '23:00', end: '08:00' },
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function checkedSessionId(value) {
  if (typeof value !== 'string') throw new TypeError('sessionId 必须是字符串')
  const id = value.trim()
  if (id.length === 0 || id.length > MAX_ID_LENGTH) throw new TypeError('sessionId 长度非法')
  return id
}

/** 状态文件位置：优先 profile 目录，回退到 ~/.dsh。 */
export function stateFilePath() {
  const profileDir = process.env.DSH_PROFILE_DIR
  const base = typeof profileDir === 'string' && profileDir.length > 0 ? profileDir : join(homedir(), '.dsh')
  return join(base, 'workspace-optimize-state.json')
}

function emptyState() {
  return {
    version: 1,
    colors: {},
    priorities: {},
    favorites: [],
    workspaceFavorites: [],
    settings: cloneSettings(DEFAULT_SETTINGS),
    updatedAt: 0,
  }
}

function cloneSettings(settings) {
  return {
    enabled: settings.enabled !== false,
    sidebarMode: settings.sidebarMode === 'native' ? 'native' : 'optimized',
    showBlankSessions: settings.showBlankSessions === true,
    workspaceHighlight: settings.workspaceHighlight === true,
    notify: { ...DEFAULT_SETTINGS.notify, ...(isPlainObject(settings.notify) ? settings.notify : {}) },
    notifyWhenVisible: settings.notifyWhenVisible === true,
    dnd: { ...DEFAULT_SETTINGS.dnd, ...(isPlainObject(settings.dnd) ? settings.dnd : {}) },
  }
}

function normalizeClock(value, fallback) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback
}

/** 把任意读入内容收敛成合法状态；非法字段丢弃而不是让插件启动失败。 */
function normalizeState(raw) {
  const base = emptyState()
  if (!isPlainObject(raw)) return base

  if (isPlainObject(raw.colors)) {
    for (const [key, color] of Object.entries(raw.colors)) {
      if (typeof key !== 'string' || key.length === 0 || key.length > MAX_ID_LENGTH) continue
      if (typeof color !== 'string' || !COLORS.includes(color)) continue
      base.colors[key] = color
    }
  }
  if (isPlainObject(raw.priorities)) {
    for (const [key, priority] of Object.entries(raw.priorities)) {
      if (typeof key !== 'string' || key.length === 0 || key.length > MAX_ID_LENGTH) continue
      if (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 0 || priority > 100) continue
      base.priorities[key] = priority
    }
  }
  if (Array.isArray(raw.favorites)) {
    base.favorites = [...new Set(raw.favorites.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH))].slice(0, MAX_FAVORITES)
  }
  if (Array.isArray(raw.workspaceFavorites)) {
    base.workspaceFavorites = [...new Set(raw.workspaceFavorites.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH))].slice(0, MAX_FAVORITES)
  }
  if (isPlainObject(raw.settings)) {
    const settings = raw.settings
    if (typeof settings.enabled === 'boolean') base.settings.enabled = settings.enabled
    if (settings.sidebarMode === 'native') base.settings.sidebarMode = 'native'
    else if (settings.sidebarMode === 'optimized') base.settings.sidebarMode = 'optimized'
    if (typeof settings.showBlankSessions === 'boolean') base.settings.showBlankSessions = settings.showBlankSessions
    if (typeof settings.workspaceHighlight === 'boolean') base.settings.workspaceHighlight = settings.workspaceHighlight
    if (typeof settings.notifyWhenVisible === 'boolean') base.settings.notifyWhenVisible = settings.notifyWhenVisible
    if (isPlainObject(settings.notify)) {
      for (const key of ['complete', 'waiting', 'error', 'started']) {
        if (typeof settings.notify[key] === 'boolean') base.settings.notify[key] = settings.notify[key]
      }
    }
    if (isPlainObject(settings.dnd)) {
      if (typeof settings.dnd.enabled === 'boolean') base.settings.dnd.enabled = settings.dnd.enabled
      base.settings.dnd.start = normalizeClock(settings.dnd.start, DEFAULT_SETTINGS.dnd.start)
      base.settings.dnd.end = normalizeClock(settings.dnd.end, DEFAULT_SETTINGS.dnd.end)
    }
  }
  if (typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)) base.updatedAt = raw.updatedAt
  return base
}

function readStateFile(filePath, logger) {
  try {
    if (!existsSync(filePath)) return emptyState()
    const text = readFileSync(filePath, 'utf8')
    return normalizeState(JSON.parse(text))
  } catch (error) {
    logger?.warn?.(`workspace-optimize: 状态文件读取失败，改用空状态：${String(error)}`)
    return emptyState()
  }
}

function writeStateFile(filePath, data) {
  const directory = dirname(filePath)
  mkdirSync(directory, { recursive: true })
  const temporary = `${filePath}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(temporary, JSON.stringify(data, null, 2), 'utf8')
  renameSync(temporary, filePath)
}

/**
 * 创建内存状态仓库：所有写操作同步落盘，并通知订阅者（SSE 广播）。
 */
export function createStore(options = {}) {
  const { logger } = options
  const filePath = stateFilePath()
  let data = readStateFile(filePath, logger)
  const completedAtById = new Map()
  const updatedAtById = new Map()
  const pendingById = new Map()
  let revision = 1
  const events = []
  const listeners = new Set()

  function snapshot() {
    return {
      revision,
      colors: { ...data.colors },
      priorities: { ...data.priorities },
      favorites: [...data.favorites],
      workspaceFavorites: [...data.workspaceFavorites],
      settings: cloneSettings(data.settings),
      updatedAt: data.updatedAt,
    }
  }

  function persist() {
    data.updatedAt = Date.now()
    revision += 1
    try {
      writeStateFile(filePath, data)
    } catch (error) {
      logger?.warn?.(`workspace-optimize: 状态文件写入失败：${String(error)}`)
    }
  }

  function announce(type, payload) {
    const frame = { type, revision, at: Date.now(), ...payload }
    for (const listener of listeners) {
      try {
        listener(frame)
      } catch {
        // 单个订阅者失败不影响其他订阅者
      }
    }
    return frame
  }

  function commit() {
    persist()
    announce('state', {})
    return snapshot()
  }

  return {
    filePath,
    snapshot,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    pushEvent(event) {
      const record = { ...event, seq: events.length + 1, at: event.at ?? Date.now() }
      events.push(record)
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)
      announce('event', { event: record })
      return record
    },

    setColor(sessionId, color) {
      if (color === null || color === undefined) {
        delete data.colors[sessionId]
      } else {
        if (typeof color !== 'string' || !COLORS.includes(color)) throw new TypeError('颜色不在允许列表内')
        data.colors[sessionId] = color
      }
      return commit()
    },

    setPriority(sessionId, priority) {
      if (priority === null || priority === undefined) {
        delete data.priorities[sessionId]
      } else {
        if (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 0 || priority > 100) {
          throw new TypeError('优先级必须是 0 到 100 的整数')
        }
        data.priorities[sessionId] = priority
      }
      return commit()
    },

    setLocalFavorite(sessionId, favorite) {
      const set = new Set(data.favorites)
      if (favorite) set.add(sessionId)
      else set.delete(sessionId)
      data.favorites = [...set].slice(0, MAX_FAVORITES)
      return commit()
    },

    localFavorites() {
      return [...data.favorites]
    },

    /** 会话完成时间（内存，不持久化）：用于侧栏「已完成未查看」的绿点。 */
    markCompleted(sessionId, at = Date.now()) {
      if (typeof sessionId === 'string' && sessionId.length > 0) completedAtById.set(sessionId, at)
    },

    completedAt(sessionId) {
      return completedAtById.get(sessionId) ?? 0
    },

    /** 会话最近活动时间（内存）：侧栏显示「修改时间」而不是创建时间。 */
    markActivity(sessionId, at) {
      if (typeof sessionId !== 'string' || sessionId.length === 0) return
      if (typeof at !== 'number' || !Number.isFinite(at) || at <= 0) return
      updatedAtById.set(sessionId, at)
    },

    activityAt(sessionId) {
      return updatedAtById.get(sessionId) ?? 0
    },

    /** 待用户处理的状态（审批 / 提问），内存态：侧栏黄灯与「等待你」通知。 */
    markPending(sessionId, kind) {
      if (typeof sessionId !== 'string' || sessionId.length === 0) return
      pendingById.set(sessionId, typeof kind === 'string' && kind.length > 0 ? kind : 'pending')
    },

    clearPending(sessionId) {
      pendingById.delete(sessionId)
    },

    pendingOf(sessionId) {
      return pendingById.get(sessionId) ?? ''
    },

    /** 工作区收藏始终由本插件保存（Archive Manager 的收藏只认会话）。 */
    setWorkspaceFavorite(workspaceId, favorite) {
      const set = new Set(data.workspaceFavorites)
      if (favorite) set.add(workspaceId)
      else set.delete(workspaceId)
      data.workspaceFavorites = [...set].slice(0, MAX_FAVORITES)
      return commit()
    },

    localWorkspaceFavorites() {
      return [...data.workspaceFavorites]
    },

    updateSettings(patch) {
      if (!isPlainObject(patch)) throw new TypeError('settings patch 必须是对象')
      if (typeof patch.enabled === 'boolean') data.settings.enabled = patch.enabled
      if (patch.sidebarMode === 'native' || patch.sidebarMode === 'optimized') data.settings.sidebarMode = patch.sidebarMode
      if (typeof patch.showBlankSessions === 'boolean') data.settings.showBlankSessions = patch.showBlankSessions
      if (typeof patch.workspaceHighlight === 'boolean') data.settings.workspaceHighlight = patch.workspaceHighlight
      if (typeof patch.notifyWhenVisible === 'boolean') data.settings.notifyWhenVisible = patch.notifyWhenVisible
      if (isPlainObject(patch.notify)) {
        for (const key of ['complete', 'waiting', 'error', 'started']) {
          if (typeof patch.notify[key] === 'boolean') data.settings.notify[key] = patch.notify[key]
        }
      }
      if (isPlainObject(patch.dnd)) {
        if (typeof patch.dnd.enabled === 'boolean') data.settings.dnd.enabled = patch.dnd.enabled
        data.settings.dnd.start = normalizeClock(patch.dnd.start, data.settings.dnd.start)
        data.settings.dnd.end = normalizeClock(patch.dnd.end, data.settings.dnd.end)
      }
      return commit()
    },

    /** 清空颜色与优先级里已不存在的会话（导出/整理用）。 */
    prune(knownSessionIds) {
      const known = new Set(knownSessionIds)
      for (const key of Object.keys(data.colors)) if (!known.has(key)) delete data.colors[key]
      for (const key of Object.keys(data.priorities)) if (!known.has(key)) delete data.priorities[key]
      return commit()
    },
  }
}
