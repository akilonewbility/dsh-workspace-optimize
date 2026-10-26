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
    if (query && typeof query.listSessions === 'function') {
      try {
        const records = await query.listSessions()
        if (Array.isArray(records)) {
          for (const record of records) {
            const id = record?.id ?? record?.sessionId
            if (typeof id === 'string') recordById.set(id, record)
          }
        }
      } catch (error) {
        logger?.warn?.(`workspace-optimize: 会话索引读取失败：${String(error)}`)
      }
    }

    const titleService = ctx.get('sessionTitle')
    const agents = ctx.get('agents')

    const sessions = wanted.map((id) => {
      const live = liveSessions.get(id)
      const record = recordById.get(id)
      let title = pickString(record?.title, record?.displayTitle)
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
        cwd: pickString(record?.cwd, live?.header?.cwd),
        updatedAt: pickNumber(record?.updatedAt, record?.lastActivityAt, record?.createdAt),
        createdAt: pickNumber(record?.createdAt),
        running,
        archived: archivedSet.has(id),
        pinned: pinnedSet.has(id),
        origin: pickString(record?.origin, live?.header?.origin),
      }
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
