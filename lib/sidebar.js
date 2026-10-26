/**
 * 自绘侧栏的数据源。
 *
 * 官方 WorkspaceBrowser 依赖 Client 侧内部快照结构；自绘版本改为由 Host 组装
 * 一份稳定 JSON，避免耦合 ui-workspace 的私有 store 形状：
 *   - 工作区与顺序：workspaceRegistry.list() 的 sessionIds
 *   - 归档/置顶集合：workspaceController.follow() 的首帧（完整 baseline）
 *   - 会话标题/时间/cwd：sessionQuery.listSessions()（live 优先的统一查询）
 *   - 运行状态：agents 服务
 * 任何字段取不到都退化为空值，不阻断侧栏渲染。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { stateFilePath } from './state.js'

/** 把对象收敛成可读摘要，用于诊断落盘（限制深度与长度）。 */
function summarize(value, depth = 0) {
  if (value === null || value === undefined) return value
  const type = typeof value
  if (type === 'string') return value.length > 120 ? `${value.slice(0, 120)}…` : value
  if (type !== 'object') return value
  if (depth >= 2) return Array.isArray(value) ? `[array:${value.length}]` : `{${Object.keys(value).slice(0, 10).join(',')}}`
  if (Array.isArray(value)) return value.slice(0, 2).map((item) => summarize(item, depth + 1))
  const output = {}
  for (const key of Object.keys(value).slice(0, 24)) output[key] = summarize(value[key], depth + 1)
  return output
}

function debugPath() {
  return join(dirname(stateFilePath()), 'workspace-optimize-sidebar-debug.json')
}

function writeDebug(data) {
  try {
    const file = debugPath()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
  } catch {
    // 诊断写入失败不影响侧栏
  }
}

function workspaceIdOf(workspace) {
  if (!workspace || typeof workspace !== 'object') return undefined
  const id = workspace.id ?? workspace.workspaceId ?? workspace.record?.id
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

function workspaceTitleOf(workspace, id) {
  const title = workspace?.title ?? workspace?.record?.title
  return typeof title === 'string' && title.length > 0 ? title : id
}

function workspacePathOf(workspace) {
  const path = workspace?.path ?? workspace?.record?.path
  return typeof path === 'string' ? path : ''
}

function sessionIdsOf(workspace) {
  const raw = workspace?.record?.sessionIds ?? workspace?.sessionIds
  return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : []
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
}

function pickString(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) return value
  return ''
}

function pickNumber(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Date.parse(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return 0
}

/**
 * 在会话记录里深度查找字段。不同宿主版本的 SessionRecord 可能是扁平结构，
 * 也可能把投影包在 `snapshot` / `value` / `header` 等对象里，这里统一兜底。
 */
function deepFind(value, keys, depth = 3) {
  if (value === null || typeof value !== 'object' || depth < 0) return undefined
  for (const key of keys) {
    const direct = value[key]
    if (direct !== undefined && direct !== null) return direct
  }
  if (Array.isArray(value)) return undefined
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object') {
      const found = deepFind(child, keys, depth - 1)
      if (found !== undefined) return found
    }
  }
  return undefined
}

export function createSidebarSource(ctx, logger) {
  /** 读取归档/置顶集合：消费 follow 流的第一帧后立即取消。 */
  async function readSets() {
    const controller = ctx.get('workspaceController')
    if (!controller || typeof controller.follow !== 'function') return { archived: [], pinned: [] }
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), 2000)
    try {
      for await (const frame of controller.follow(abort.signal)) {
        if (frame && typeof frame === 'object') {
          return {
            archived: stringArray(frame.archivedSessionIds),
            pinned: stringArray(frame.pinnedSessionIds),
          }
        }
        break
      }
    } catch (error) {
      logger?.warn?.(`workspace-optimize: 读取归档/置顶集合失败：${String(error)}`)
    } finally {
      clearTimeout(timer)
      abort.abort()
    }
    return { archived: [], pinned: [] }
  }

  async function snapshot() {
    const registry = ctx.get('workspaceRegistry')
    const workspaces = []
    if (registry && typeof registry.list === 'function') {
      for (const workspace of registry.list()) {
        const id = workspaceIdOf(workspace)
        if (!id) continue
        workspaces.push({
          id,
          title: workspaceTitleOf(workspace, id),
          path: workspacePathOf(workspace),
          sessionIds: sessionIdsOf(workspace),
        })
      }
    }

    const { archived, pinned } = await readSets()
    const archivedSet = new Set(archived)
    const pinnedSet = new Set(pinned)

    const wanted = []
    const seen = new Set()
    for (const workspace of workspaces) {
      for (const id of workspace.sessionIds) {
        if (seen.has(id)) continue
        seen.add(id)
        wanted.push(id)
      }
    }

    const liveSessions = new Map()
    const sessionsService = ctx.get('sessions')
    if (sessionsService && typeof sessionsService.list === 'function') {
      for (const session of sessionsService.list()) {
        if (session && typeof session.id === 'string') liveSessions.set(session.id, session)
      }
    }

    const recordById = new Map()
    const query = ctx.get('sessionQuery')
    let records = []
    if (query && typeof query.listSessions === 'function') {
      try {
        const listed = await query.listSessions()
        if (Array.isArray(listed)) {
          records = listed
          for (const record of listed) {
            // 官方 SessionRecord 的形状是 { header, live, persisted, formatStatus }：
            // id/cwd/createdAt 都在 header 里。
            const id = record?.header?.id ?? record?.id ?? record?.sessionId
            if (typeof id === 'string') recordById.set(id, record)
          }
        }
      } catch (error) {
        logger?.warn?.(`workspace-optimize: 会话索引读取失败：${String(error)}`)
      }
    }

    const titleService = ctx.get('sessionTitle')
    const agents = ctx.get('agents')

    // 冷会话没有 live Session，sessionTitle.get() 取不到；批量标题投影是官方入口。
    // 返回形状：{ sessionId, status, value: { session, title: { title, updatedAt, ... } } }
    const titleById = new Map()
    const timeById = new Map()
    const observationById = new Map()
    let titleObservations = null
    if (query && typeof query.readTitleSnapshots === 'function' && wanted.length > 0) {
      try {
        const observations = await query.readTitleSnapshots(wanted)
        titleObservations = observations
        for (const item of Array.isArray(observations) ? observations : []) {
          const id = item?.sessionId ?? item?.id ?? deepFind(item, ['sessionId'])
          const title = pickString(
            item?.value?.title?.title,
            item?.title,
            item?.snapshot?.title,
            item?.observation?.title,
            deepFind(item, ['title']),
          )
          const updatedAt = pickNumber(item?.value?.title?.updatedAt, item?.value?.updatedAt)
          if (typeof id !== 'string') continue
          observationById.set(id, item)
          if (title) titleById.set(id, title)
          if (updatedAt > 0) timeById.set(id, updatedAt)
        }
      } catch (error) {
        logger?.warn?.(`workspace-optimize: 批量标题读取失败：${String(error)}`)
      }
    }

    // 批量投影中仍缺标题的会话（常见于旧日志或缺投影的冷会话）单条再读一次。
    const stillMissing = wanted.filter((sessionId) => !titleById.has(sessionId)).slice(0, 16)
    const singleReads = []
    if (query && typeof query.readTitle === 'function') {
      for (const sessionId of stillMissing) {
        try {
          const snapshotValue = await query.readTitle(sessionId)
          const title = pickString(
            snapshotValue?.title?.title,
            snapshotValue?.title,
            snapshotValue?.displayTitle,
            deepFind(snapshotValue, ['title']),
          )
          if (title) {
            titleById.set(sessionId, title)
            singleReads.push({ sessionId, ok: true })
          } else {
            singleReads.push({ sessionId, ok: false, sample: summarize(snapshotValue) })
          }
        } catch (error) {
          singleReads.push({ sessionId, ok: false, error: String(error) })
        }
      }
    }

    // 单条标题仍拿不到时，再尝试会话表面快照与日志里的标题事件。
    const deepReads = []
    if (query) {
      const afterSingle = wanted.filter((sessionId) => !titleById.has(sessionId)).slice(0, 5)
      for (const sessionId of afterSingle) {
        let title = ''
        try {
          if (typeof query.readSurface === 'function') {
            const surface = await query.readSurface(sessionId)
            title = pickString(surface?.title?.title, surface?.title, deepFind(surface, ['title']))
            deepReads.push({ sessionId, from: 'surface', ok: Boolean(title) })
          }
        } catch (error) {
          deepReads.push({ sessionId, from: 'surface', ok: false, error: String(error) })
        }
        if (title) {
          titleById.set(sessionId, title)
          continue
        }
        try {
          if (typeof query.readSession === 'function') {
            const log = await query.readSession(sessionId)
            const events = Array.isArray(log?.events)
              ? log.events
              : Array.isArray(log?.snapshot?.events)
                ? log.snapshot.events
                : []
            for (let index = events.length - 1; index >= 0; index -= 1) {
              const event = events[index]
              const type = String(event?.type ?? '')
              if (!/title/i.test(type)) continue
              title = pickString(
                event?.data?.title,
                event?.data?.value,
                event?.data?.snapshot?.title,
                deepFind(event?.data, ['title']),
              )
              if (title) break
            }
            deepReads.push({ sessionId, from: 'log', ok: Boolean(title), events: events.length })
            if (title) titleById.set(sessionId, title)
          }
        } catch (error) {
          deepReads.push({ sessionId, from: 'log', ok: false, error: String(error) })
        }
      }
    }

    const sessions = wanted.map((id) => {
      const live = liveSessions.get(id)
      const record = recordById.get(id)
      let title = pickString(
        titleById.get(id),
        record?.title,
        record?.displayTitle,
        deepFind(record, ['title', 'displayTitle', 'name']),
      )
      if (!title && live && titleService && typeof titleService.get === 'function') {
        try {
          title = pickString(titleService.get(live)?.title)
        } catch {
          title = ''
        }
      }
      let running = false
      try {
        const agent = agents && typeof agents.get === 'function' ? agents.get(id) : undefined
        running = Boolean(agent && (agent.status === 'running' || agent.busy === true))
      } catch {
        running = false
      }
      if (!running && live) running = live.running === true || live.status === 'running'
      return {
        id,
        title,
        cwd: pickString(record?.header?.cwd, record?.cwd, live?.header?.cwd, deepFind(record, ['cwd'])),
        updatedAt: pickNumber(
          timeById.get(id),
          record?.header?.updatedAt,
          record?.updatedAt,
          record?.lastActivityAt,
          record?.header?.createdAt,
          deepFind(record, ['updatedAt', 'lastActivityAt', 'lastMessageAt', 'mtime']),
        ),
        createdAt: pickNumber(record?.header?.createdAt, record?.createdAt, deepFind(record, ['createdAt'])),
        running,
        archived: archivedSet.has(id),
        pinned: pinnedSet.has(id),
        origin: pickString(record?.header?.origin, record?.origin, live?.header?.origin),
      }
    })

    const missingTitles = sessions.filter((session) => !session.title).map((session) => session.id).slice(0, 10)
    writeDebug({
      at: new Date().toISOString(),
      wanted: wanted.length,
      records: recordById.size,
      titles: titleById.size,
      readTitleSnapshots: typeof query?.readTitleSnapshots === 'function',
      observeSession: typeof query?.observeSession === 'function',
      recordKeys: records[0] ? Object.keys(records[0]).slice(0, 30) : [],
      recordSample: summarize(records[0]),
      titleObservationCount: Array.isArray(titleObservations) ? titleObservations.length : null,
      titleSample: summarize(Array.isArray(titleObservations) ? titleObservations[0] : titleObservations),
      singleReads,
      deepReads,
      workspaces: workspaces.map((workspace) => ({
        id: workspace.id,
        title: workspace.title,
        path: workspace.path,
        count: workspace.sessionIds.length,
        first: workspace.sessionIds.slice(0, 2),
      })),
      missingDetail: sessions
        .filter((session) => !session.title)
        .slice(0, 8)
        .map((session) => ({
          id: session.id,
          cwd: session.cwd,
          recordCwd: recordById.get(session.id)?.header?.cwd,
          recordLive: recordById.get(session.id)?.live,
          observation: summarize(observationById.get(session.id)),
        })),
      missingTitles,
    })

    return {
      ok: true,
      at: Date.now(),
      workspaces,
      sessions,
      archivedSessionIds: archived,
      pinnedSessionIds: pinned,
      capabilities: {
        archive: true,
        pin: typeof registry?.pinSession === 'function',
        rename: Boolean(titleService && typeof titleService.rename === 'function'),
        delete: typeof registry?.deleteSession === 'function',
      },
    }
  }

  /** 会话重命名：官方没有 Client Remote，只能由 Host 调 sessionTitle.rename。 */
  function renameSession(sessionId, title) {
    const sessionsService = ctx.get('sessions')
    const session = sessionsService && typeof sessionsService.get === 'function' ? sessionsService.get(sessionId) : undefined
    if (!session) throw new Error('会话未在运行，暂时只能在活动会话上重命名标题')
    const titleService = ctx.get('sessionTitle')
    if (!titleService || typeof titleService.rename !== 'function') throw new Error('宿主未提供标题服务')
    const snapshotValue = titleService.rename(session, title)
    return { ok: true, title: snapshotValue?.title ?? title }
  }

  return { snapshot, renameSession }
}
