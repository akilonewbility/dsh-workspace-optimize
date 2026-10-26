/**
 * 能力适配器：把「宿主已有能力」和「本插件自建状态」隔开。
 *
 * - 收藏：已安装 @michengai/dsh-archive-manager 时复用它的收藏，保证两处星标一致；
 *   否则落在本插件自己的状态文件里。
 * - 跨工作区移动：只有 archive-manager 注入了 moveSessionToWorkspace 才提供；
 *   它已经实现了带备份与回滚的物理搬迁，本插件不重复实现高风险的文件操作。
 * - 置顶：使用 workspaceRegistry 的 pinSession/unpinSession。
 * - 工作区列表与排序：workspaceRegistry 的实体字段在不同版本出现过 id/workspaceId
 *   与 record 包裹的差异，这里统一兼容。
 *
 * 注意：registry 必须**每次调用时重新获取**。插件 apply 时若该服务尚未激活，
 * 一次性取值会永久拿到 undefined；archive-manager 也会在稍后把自定义方法拷到
 * registry 实例上，动态获取才能看到它们。
 */

function registryOf(ctx) {
  try {
    const direct = Reflect.get(ctx, 'workspaceRegistry')
    if (direct !== undefined && direct !== null) return direct
  } catch {
    // 服务访问器可能拒绝未声明的读取，回退到 get
  }
  try {
    return typeof ctx.get === 'function' ? ctx.get('workspaceRegistry') : undefined
  } catch {
    return undefined
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

function workspaceSessionIdsOf(workspace) {
  const raw = workspace?.record?.sessionIds ?? workspace?.sessionIds
  return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : []
}

function favoriteIdsOf(value) {
  if (Array.isArray(value)) return value.filter((id) => typeof id === 'string')
  if (value && Array.isArray(value.favoriteSessionIds)) return value.favoriteSessionIds.filter((id) => typeof id === 'string')
  return []
}

export function createAdapters(ctx, store, logger) {
  function registry() {
    return registryOf(ctx)
  }

  function hasArchiveFavorites() {
    const instance = registry()
    return Boolean(
      instance && typeof instance.favoriteSessions === 'function' && typeof instance.setSessionFavorite === 'function',
    )
  }

  function hasMove() {
    const instance = registry()
    return Boolean(instance && typeof instance.moveSessionToWorkspace === 'function')
  }

  function hasPin() {
    const instance = registry()
    return Boolean(instance && typeof instance.pinSession === 'function' && typeof instance.unpinSession === 'function')
  }

  function listWorkspaces() {
    const instance = registry()
    if (!instance || typeof instance.list !== 'function') return []
    return instance
      .list()
      .map((workspace) => {
        const id = workspaceIdOf(workspace)
        if (!id) return undefined
        return { id, title: workspaceTitleOf(workspace, id), path: workspacePathOf(workspace) }
      })
      .filter(Boolean)
  }

  async function listFavorites() {
    if (!hasArchiveFavorites()) return store.localFavorites()
    try {
      const value = await registry().favoriteSessions()
      return favoriteIdsOf(value)
    } catch (error) {
      logger?.warn?.(`workspace-optimize: 读取 archive-manager 收藏失败，回退本插件状态：${String(error)}`)
      return store.localFavorites()
    }
  }

  async function setFavorite(sessionId, favorite) {
    if (!hasArchiveFavorites()) {
      store.setLocalFavorite(sessionId, favorite)
      return { source: 'local' }
    }
    await registry().setSessionFavorite({ sessionId, favorite })
    return { source: 'archive-manager' }
  }

  async function moveSession(sessionId, targetWorkspaceId) {
    if (!hasMove()) {
      throw new Error('跨工作区移动需要安装并启用 @michengai/dsh-archive-manager；未检测到其移动能力。')
    }
    const result = await registry().moveSessionToWorkspace({ sessionId, targetWorkspaceId })
    return result ?? { ok: true }
  }

  async function setPinned(sessionId, pinned) {
    if (!hasPin()) throw new Error('宿主未提供置顶能力（workspaceRegistry.pinSession）。')
    if (pinned) await registry().pinSession(sessionId)
    else await registry().unpinSession(sessionId)
    return { pinned }
  }

  function listSessionIds() {
    const instance = registry()
    if (!instance || typeof instance.list !== 'function') return []
    const ids = []
    for (const workspace of instance.list()) ids.push(...workspaceSessionIdsOf(workspace))
    return ids
  }

  /**
   * 计算官方排序写入的目标位置。
   *
   * `insertSessionBefore` 的语义是「把 session 插到 beforeSessionId 之前」，
   * 因此下移一位要锚定在原位置后第二个会话；省略 beforeSessionId 表示追加到末尾。
   */
  function resolveOrder(sessionId, action) {
    const instance = registry()
    if (!instance || typeof instance.list !== 'function') return null
    if (!['up', 'down', 'top', 'bottom'].includes(action)) return null
    for (const workspace of instance.list()) {
      const workspaceId = workspaceIdOf(workspace)
      if (!workspaceId) continue
      const ids = workspaceSessionIdsOf(workspace)
      const index = ids.indexOf(sessionId)
      if (index < 0) continue
      if (action === 'up') {
        if (index === 0) return { unchanged: true, workspaceId, sessionId }
        return { workspaceId, sessionId, beforeSessionId: ids[index - 1] }
      }
      if (action === 'top') {
        if (index === 0) return { unchanged: true, workspaceId, sessionId }
        return { workspaceId, sessionId, beforeSessionId: ids[0] }
      }
      if (action === 'down') {
        if (index >= ids.length - 1) return { unchanged: true, workspaceId, sessionId }
        return { workspaceId, sessionId, beforeSessionId: ids[index + 2] }
      }
      if (index >= ids.length - 1) return { unchanged: true, workspaceId, sessionId }
      return { workspaceId, sessionId, beforeSessionId: undefined }
    }
    return null
  }

  return {
    capabilities: () => ({
      favoritesFromArchiveManager: hasArchiveFavorites(),
      move: hasMove(),
      pin: hasPin(),
    }),
    listFavorites,
    setFavorite,
    listWorkspaces,
    moveSession,
    setPinned,
    listSessionIds,
    resolveOrder,
  }
}
