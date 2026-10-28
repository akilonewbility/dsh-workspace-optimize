/**
 * Host 侧 HTTP 接口与 SSE 事件流。
 *
 * 注意：`/api/*` 下的路由必须注册到 `ctx.connection.fetch`（Connection 的 exact
 * Fetch 路由表）。用 `ctx.webServer.register` 注册的路径不会被 `/api` 分发器认领，
 * 浏览器请求会得到 404。官方 session-log-export 包是同一写法：
 *   ctx.connection.fetch.register({ path: '/api/xxx', methods, requestBody, fetch })
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { checkedSessionId } from './state.js'
import { createSidebarSource } from './sidebar.js'

const PREFIX = '/api/workspace-optimize'
const HEARTBEAT_MS = 15000
const TIMING_FILE = join(homedir(), '.dsh', 'workspace-optimize-timing.json')

/** 诊断用：把 /sidebar 的服务端耗时与浏览器半的刷新耗时追加到同一文件。 */
function recordTiming(entry) {
  try {
    let list = []
    try {
      const parsed = JSON.parse(readFileSync(TIMING_FILE, 'utf8'))
      if (Array.isArray(parsed)) list = parsed
    } catch {
      list = []
    }
    list.push(entry)
    if (list.length > 300) list = list.slice(-300)
    writeFileSync(TIMING_FILE, JSON.stringify(list, null, 2), 'utf8')
  } catch {
    // 诊断写入失败不影响主流程
  }
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function errorResponse(error, status = 400) {
  const message = error instanceof Error ? error.message : String(error)
  return jsonResponse({ ok: false, error: message }, status)
}

async function readJsonBody(request) {
  const text = await request.text()
  if (typeof text !== 'string' || text.trim().length === 0) return {}
  if (text.length > 64 * 1024) throw new Error('请求体过大')
  const parsed = JSON.parse(text)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('请求体必须是 JSON 对象')
  }
  return parsed
}

export function installApi(ctx, store, adapters, logger) {
  const connection = Reflect.get(ctx, 'connection')
  if (!connection || !connection.fetch || typeof connection.fetch.register !== 'function') {
    throw new Error('connection.fetch 不可用，无法注册 /api 路由')
  }

  const streams = new Set()
  const registrations = []
  const errors = []
  const sidebar = createSidebarSource(ctx, logger, store)

  function broadcast(frame) {
    const payload = `data: ${JSON.stringify(frame)}\n\n`
    for (const client of [...streams]) {
      try {
        client.write(payload)
      } catch {
        client.close()
      }
    }
  }

  const unsubscribe = store.subscribe(broadcast)

  function createSseResponse(request) {
    const encoder = new TextEncoder()
    let heartbeat = null
    let closed = false
    let client = null

    const cleanup = () => {
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = null
      }
      if (client) streams.delete(client)
    }

    const stream = new ReadableStream({
      start(controller) {
        client = {
          write(text) {
            if (closed) return
            try {
              controller.enqueue(encoder.encode(text))
            } catch {
              closed = true
              cleanup()
            }
          },
          close() {
            if (closed) return
            closed = true
            cleanup()
            try {
              controller.close()
            } catch {
              // 已关闭
            }
          },
        }
        streams.add(client)
        client.write('retry: 3000\n\n')
        heartbeat = setInterval(() => client.write(': ping\n\n'), HEARTBEAT_MS)
        heartbeat?.unref?.()
        const onAbort = () => client.close()
        request.signal.addEventListener('abort', onAbort, { once: true })
      },
      cancel() {
        closed = true
        cleanup()
      },
    })

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      },
    })
  }

  async function statePayload() {
    let favorites = []
    try {
      favorites = await adapters.listFavorites()
    } catch (error) {
      logger?.warn?.(`workspace-optimize: 收藏读取失败：${String(error)}`)
    }
    const snapshot = store.snapshot()
    return {
      ok: true,
      revision: snapshot.revision,
      colors: snapshot.colors,
      priorities: snapshot.priorities,
      favorites,
      workspaceFavorites: snapshot.workspaceFavorites,
      settings: snapshot.settings,
      updatedAt: snapshot.updatedAt,
      capabilities: adapters.capabilities(),
      stateFile: store.filePath,
    }
  }

  /**
   * 当前界面 bundle 的修订号。页面侧从 window.__DSH_BOOT__ 读同一 entry 的 rev，
   * 两者不一致就说明 client.js 已被重新构建、需要重载页面。
   */
  function clientRevPayload() {
    const modules = ctx.get('clientModules')
    if (!modules || typeof modules.graph !== 'function') {
      return { ok: false, error: 'clientModules 不可用' }
    }
    let graph
    try {
      graph = modules.graph()
    } catch (error) {
      return { ok: false, error: String(error) }
    }
    const entries = Array.isArray(graph?.entries) ? graph.entries : []
    const entry = entries.find((item) => item && item.id === 'dsh-workspace-optimize')
    return {
      ok: true,
      id: 'dsh-workspace-optimize',
      rev: typeof entry?.rev === 'string' ? entry.rev : '',
      url: typeof entry?.url === 'string' ? entry.url : '',
      graphRev: typeof graph?.rev === 'string' ? graph.rev : '',
    }
  }

  async function handle(request) {
    let url
    try {
      url = new URL(request.url)
    } catch {
      return errorResponse('请求地址无效')
    }
    const pathname = url.pathname
    const route = pathname.startsWith(PREFIX) ? pathname.slice(PREFIX.length) : '/'

    if (route === '/state') return jsonResponse(await statePayload())
    if (route === '/client-rev') return jsonResponse(clientRevPayload())
    if (route === '/events') return createSseResponse(request)
    if (route === '/sidebar') {
      const started = Date.now()
      const data = await sidebar.snapshot()
      const duration = Date.now() - started
      const sessions = Array.isArray(data.sessions) ? data.sessions : []
      recordTiming({
        type: 'sidebar',
        at: started,
        duration,
        count: sessions.length,
        running: sessions.filter((session) => session.running === true).length,
        pendings: sessions
          .filter((session) => typeof session.pending === 'string' && session.pending.length > 0)
          .map((session) => ({ id: String(session.id).slice(0, 14), pending: session.pending })),
      })
      return jsonResponse(data)
    }
    if (route === '/workspaces') return jsonResponse({ ok: true, workspaces: adapters.listWorkspaces() })

    if (route === '/order') {
      const sessionId = checkedSessionId(url.searchParams.get('sessionId') ?? '')
      const action = url.searchParams.get('action') ?? ''
      const target = adapters.resolveOrder(sessionId, action)
      if (!target) return errorResponse('会话不在任何工作区的排序序列中', 404)
      sidebar.invalidate()
      return jsonResponse({ ok: true, target })
    }

    if (request.method !== 'POST') return errorResponse('方法不允许', 405)

    const body = await readJsonBody(request)

    if (route === '/favorite') {
      const sessionId = checkedSessionId(body.sessionId)
      const result = await adapters.setFavorite(sessionId, body.favorite === true)
      return jsonResponse({ ok: true, source: result.source, favorites: await adapters.listFavorites() })
    }

    if (route === '/workspace') {
      const workspaceId = checkedSessionId(body.workspaceId)
      store.setWorkspaceFavorite(workspaceId, body.favorite === true)
      sidebar.invalidate()
      return jsonResponse({ ok: true, workspaceFavorites: store.snapshot().workspaceFavorites })
    }

    if (route === '/invalidate') {
      // 浏览器半在官方 Remote 写操作（归档/排序/新增工作区）后调用，精确失效 Host 快照。
      const sessionId = typeof body.sessionId === 'string' && body.sessionId.length > 0 ? body.sessionId : undefined
      sidebar.invalidate(sessionId)
      return jsonResponse({ ok: true })
    }

    if (route === '/diag') {
      // 诊断用：浏览器半上报一次刷新的时间线（事件到达、等待写操作、请求往返）。
      recordTiming({ type: 'client', ...(body && typeof body === 'object' ? body : {}) })
      return jsonResponse({ ok: true })
    }

    if (route === '/color') {
      const sessionId = checkedSessionId(body.sessionId)
      store.setColor(sessionId, body.color ?? null)
      return jsonResponse({ ok: true, colors: store.snapshot().colors })
    }

    if (route === '/priority') {
      const sessionId = checkedSessionId(body.sessionId)
      store.setPriority(sessionId, body.priority ?? null)
      return jsonResponse({ ok: true, priorities: store.snapshot().priorities })
    }

    if (route === '/settings') {
      store.updateSettings(body)
      return jsonResponse({ ok: true, settings: store.snapshot().settings })
    }

    if (route === '/rename') {
      const sessionId = checkedSessionId(body.sessionId)
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
      if (title.length === 0) return errorResponse('标题不能为空')
      const result = sidebar.renameSession(sessionId, title)
      sidebar.invalidate(sessionId)
      return jsonResponse(result)
    }

    if (route === '/delete') {
      // 官方没有删除会话的 API（只支持归档），明确拒绝而不是静默。
      return errorResponse('官方不支持删除会话，请使用归档', 400)
    }

    if (route === '/move') {
      const sessionId = checkedSessionId(body.sessionId)
      const targetWorkspaceId = checkedSessionId(body.targetWorkspaceId)
      const result = await adapters.moveSession(sessionId, targetWorkspaceId)
      sidebar.invalidate()
      return jsonResponse({ ok: true, result })
    }

    if (route === '/pin') {
      const sessionId = checkedSessionId(body.sessionId)
      const result = await adapters.setPinned(sessionId, body.pinned === true)
      sidebar.invalidate()
      return jsonResponse({ ok: true, ...result })
    }

    if (route === '/prune') {
      const ids = Array.isArray(body.sessionIds) ? body.sessionIds.filter((id) => typeof id === 'string') : []
      store.prune(ids)
      return jsonResponse({ ok: true })
    }

    return errorResponse('未知接口', 404)
  }

  const route = (suffix, methods, fetch) => {
    const path = `${PREFIX}${suffix}`
    try {
      const dispose = connection.fetch.register({ path, methods, requestBody: 'buffered', fetch })
      registrations.push(path)
      return () => {
        try {
          const result = dispose()
          if (result && typeof result.catch === 'function') result.catch(() => {})
        } catch {
          // 已卸载
        }
      }
    } catch (error) {
      const message = `${path}: ${error instanceof Error ? error.message : String(error)}`
      errors.push(message)
      logger?.warn?.(`workspace-optimize: 注册路由失败 ${message}`)
      return () => {}
    }
  }

  const wrap = (fetch) => async (request) => {
    try {
      return await fetch(request)
    } catch (error) {
      return errorResponse(error)
    }
  }

  const disposers = [
    route('/state', ['GET', 'HEAD'], wrap(handle)),
    route('/client-rev', ['GET'], wrap(handle)),
    route('/events', ['GET'], wrap(handle)),
    route('/sidebar', ['GET'], wrap(handle)),
    route('/workspaces', ['GET'], wrap(handle)),
    route('/order', ['GET'], wrap(handle)),
    route('/favorite', ['POST'], wrap(handle)),
    route('/workspace', ['POST'], wrap(handle)),
    route('/color', ['POST'], wrap(handle)),
    route('/priority', ['POST'], wrap(handle)),
    route('/settings', ['POST'], wrap(handle)),
    route('/rename', ['POST'], wrap(handle)),
    route('/delete', ['POST'], wrap(handle)),
    route('/move', ['POST'], wrap(handle)),
    route('/pin', ['POST'], wrap(handle)),
    route('/invalidate', ['POST'], wrap(handle)),
    route('/diag', ['POST'], wrap(handle)),
    route('/prune', ['POST'], wrap(handle)),
  ]

  return {
    routes: registrations,
    errors,
    dispose: () => {
      unsubscribe()
      for (const client of [...streams]) client.close()
      for (const dispose of disposers) dispose()
    },
  }
}
