/**
 * Host 侧会话事件采集。
 *
 * Client 拿不到「所有会话的运行状态」（会话行插槽的 hooks 只面向单行，
 * 且逐会话 retain 会激活会话），所以由 Host 监听宿主事件，把事实推给 Client，
 * 由 Client 结合窗口可见性与用户设置决定是否弹通知。
 */

const DEDUPE_WINDOW_MS = 1000

function sessionIdOfSummary(summary) {
  if (!summary || typeof summary !== 'object') return undefined
  const id = summary.id ?? summary.sessionId
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

function titleOfSummary(summary) {
  if (!summary || typeof summary !== 'object') return undefined
  const title = summary.title ?? summary.displayTitle ?? summary.name
  return typeof title === 'string' && title.length > 0 ? title : undefined
}

function pickText(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) return value
  return ''
}

export function installEventCapture(ctx, store, logger) {
  const titles = new Map()
  const running = new Map()
  const lastEmitted = new Map()
  const disposers = []

  function emit(kind, sessionId, extra = {}) {
    if (typeof sessionId !== 'string' || sessionId.length === 0) return
    // 这里只负责「状态事实」的广播；是否弹通知由浏览器半按用户设置决定，
    // 否则默认关闭的 notify.started 会让侧栏在会话开始时不刷新。
    const key = `${kind}:${sessionId}`
    const now = Date.now()
    if ((lastEmitted.get(key) ?? 0) + DEDUPE_WINDOW_MS > now) return
    lastEmitted.set(key, now)
    store.pushEvent({ kind, sessionId, title: titles.get(sessionId) ?? '', ...extra })
  }

  function listen(name, handler) {
    try {
      const off = ctx.on(name, handler)
      disposers.push(() => off?.())
    } catch (error) {
      logger?.warn?.(`workspace-optimize: 订阅 ${name} 失败：${String(error)}`)
    }
  }

  listen('api-session/added', (summary) => {
    const id = sessionIdOfSummary(summary)
    if (!id) return
    const title = titleOfSummary(summary)
    if (title) titles.set(id, title)
    if (typeof summary?.updatedAt === 'number') store.markActivity?.(id, summary.updatedAt)
  })

  // 「最近修改时间」的权威来源：用户消息推进的活动时间。
  listen('api-session/activity', (sessionId, updatedAt) => {
    store.markActivity?.(sessionId, updatedAt)
  })

  /**
   * 完成通知需要「会话标题 + 最终答复」。标题优先取缓存，其次单条标题投影；
   * 最终答复从会话日志末尾找最后一条 assistant/message，截断约 60 字。
   */
  async function emitComplete(sessionId) {
    let title = titles.get(sessionId) ?? ''
    let summary = ''
    const query = ctx.get('sessionQuery')
    if (query) {
      if (!title && typeof query.readTitle === 'function') {
        try {
          const snapshotValue = await query.readTitle(sessionId)
          title = pickText(snapshotValue?.title?.title, snapshotValue?.title, snapshotValue?.displayTitle)
          if (title) titles.set(sessionId, title)
        } catch {
          title = ''
        }
      }
      if (typeof query.readSession === 'function') {
        try {
          const log = await query.readSession(sessionId)
          const events = Array.isArray(log?.events) ? log.events : []
          for (let index = events.length - 1; index >= 0; index -= 1) {
            const event = events[index]
            if (String(event?.type) !== 'assistant/message') continue
            const data = event?.data && typeof event.data === 'object' ? event.data : {}
            const message = data.message && typeof data.message === 'object' ? data.message : data
            const content = message?.content
            const text =
              typeof content === 'string'
                ? content
                : Array.isArray(content)
                  ? content
                      .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
                      .map((block) => block.text)
                      .join(' ')
                  : ''
            if (text.trim().length > 0) {
              summary = text.trim().replace(/\s+/g, ' ').slice(0, 60)
              break
            }
          }
        } catch {
          summary = ''
        }
      }
    }
    emit('complete', sessionId, { title, summary })
  }

  listen('api-session/status', (sessionId, isRunning) => {
    if (typeof sessionId !== 'string' || sessionId.length === 0) return
    const previous = running.get(sessionId) === true
    running.set(sessionId, isRunning === true)
    if (isRunning === true && previous === false) {
      // 新一轮开始，之前的「等待用户」状态结束
      store.clearPending?.(sessionId)
      emit('started', sessionId)
    }
    if (isRunning === false && previous === true) {
      store.markCompleted?.(sessionId)
      void emitComplete(sessionId)
    }
  })

  // 审批与提问是运行时 waterfall 事件（不是会话日志事件），必须单独订阅。
  listen('approval/request', function (request, next) {
    try {
      const sessionId = request?.agent?.id
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        store.markPending?.(sessionId, 'approval')
        emit('waiting', sessionId, { detail: 'approval', tool: typeof request?.toolName === 'string' ? request.toolName : '' })
      }
    } catch {
      // 取不到会话时仍继续分发
    }
    return next()
  })

  listen('user-questions/request', function (request, next) {
    try {
      const sessionId = request?.agent?.id
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        store.markPending?.(sessionId, 'question')
        emit('waiting', sessionId, { detail: 'question' })
      }
    } catch {
      // 取不到会话时仍继续分发
    }
    return next()
  })

  listen('api-session/error', (sessionId, message) => {
    emit('error', sessionId, { message: typeof message === 'string' ? message : '' })
  })

  listen('session/event', (session, event) => {
    const sessionId = session && typeof session === 'object' ? session.id : undefined
    if (typeof sessionId !== 'string' || sessionId.length === 0) return
    const type = typeof event?.type === 'string' ? event.type : ''
    if (!type) return
    // 等待用户输入：审批、提问、用户问题等事件名都含这些词；未知类型不会误判。
    if (/approval|user-question|ask_user_question/i.test(type)) emit('waiting', sessionId, { detail: type })
    // 新的回合/步骤或工具结果意味着等待已被处理
    if (type === 'turn/start' || type === 'tool/result' || type === 'assistant/message') store.clearPending?.(sessionId)
    // 回合结束作为 complete 的兜底（与 api-session/status 共用去抖窗口）。
    if (type === 'turn/end' || type === 'turn-end') emit('complete', sessionId, { detail: type })
  })

  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose()
      } catch {
        // 卸载阶段的清理失败不应阻断其他清理
      }
    }
  }
}
