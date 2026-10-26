/**
 * dsh-workspace-optimize · Host 半
 *
 * 职责：
 * 1. 保存颜色、优先级、设置与自建收藏（JSON 文件）；
 * 2. 把会话动作（回合结束、等待输入、出错、开始）推给浏览器半侧；
 * 3. 提供收藏、置顶、跨工作区移动的适配入口。
 *
 * 浏览器半侧见 ./client.js。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createStore, stateFilePath } from './lib/state.js'
import { createAdapters } from './lib/adapters.js'
import { installApi } from './lib/api.js'
import { installEventCapture } from './lib/events.js'

export const name = 'workspace-optimize'
// `/api` 路由必须注册到 connection.fetch，因此 connection 是硬依赖；
// workspaceRegistry 也必须就绪，否则收藏/移动/置顶的能力探测会在 apply 时落空。
export const inject = ['connection', 'workspaceRegistry']

function diagPath() {
  return join(dirname(stateFilePath()), 'workspace-optimize-diag.json')
}

/** 把安装结果写到 profile 目录，便于没有浏览器控制时确认路由注册情况。 */
function writeDiagnostics(data) {
  try {
    const file = diagPath()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ ...data, diagFile: file }, null, 2), 'utf8')
  } catch {
    // 诊断写入失败不影响插件
  }
}

export function apply(ctx) {
  const logger = ctx.logger ?? console
  const store = createStore({ logger })
  const adapters = createAdapters(ctx, store, logger)

  const cleanupEventCapture = installEventCapture(ctx, store, logger)

  let cleanupApi = () => {}
  try {
    const api = installApi(ctx, store, adapters, logger)
    cleanupApi = api.dispose
    writeDiagnostics({
      ok: api.errors.length === 0,
      at: new Date().toISOString(),
      routes: api.routes,
      errors: api.errors,
      capabilities: adapters.capabilities(),
      stateFile: store.filePath,
      origin: safeOrigin(ctx),
    })
    if (api.errors.length > 0) {
      logger?.warn?.(`workspace-optimize: 部分路由注册失败（${api.errors.length} 条），详见 ${diagPath()}`)
    }
  } catch (error) {
    writeDiagnostics({
      ok: false,
      at: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      capabilities: adapters.capabilities(),
      stateFile: store.filePath,
    })
    logger?.warn?.(`workspace-optimize: /api 路由注册失败：${String(error)}`)
  }

  ctx.effect(
    () => () => {
      try {
        cleanupApi()
      } catch {
        // 已清理
      }
      try {
        cleanupEventCapture()
      } catch {
        // 已清理
      }
    },
    'workspace-optimize: resources',
  )
}

function safeOrigin(ctx) {
  try {
    const server = Reflect.get(ctx, 'webServer')
    return server && typeof server.getOrigin === 'function' ? server.getOrigin() : undefined
  } catch {
    return undefined
  }
}
