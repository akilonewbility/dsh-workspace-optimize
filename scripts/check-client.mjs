/**
 * 开发用：在 Node 里模拟 Module Loader 执行 client.js 的 factory，
 * 用于定位「import failed」这类模块加载期错误（不启动浏览器）。
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
let factoryResult = null

function makeRequire() {
  return (name) => {
    if (name === 'react') {
      class Component {
        constructor(props) {
          this.props = props
          this.state = {}
        }
        setState(next) {
          this.state = { ...this.state, ...(typeof next === 'function' ? next(this.state) : next) }
        }
      }
      return {
        createElement: () => null,
        Component,
        Fragment: {},
        useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
        useEffect: () => {},
        useRef: (initial) => ({ current: initial }),
        useSyncExternalStore: () => null,
      }
    }
    if (name === 'react/jsx-runtime') return { jsx: () => null }
    throw new Error(`unexpected require: ${name}`)
  }
}

const windowStub = {
  __ModuleLoader__: {
    load(definition) {
      try {
        factoryResult = definition.factory(makeRequire())
      } catch (error) {
        console.error('FACTORY_THROW:', error)
        process.exitCode = 1
      }
    },
  },
  location: { reload() {}, pathname: '/', search: '', href: 'http://127.0.0.1/' },
  innerWidth: 1024,
  innerHeight: 768,
  focus() {},
}

globalThis.window = windowStub
globalThis.document = {
  baseURI: 'http://127.0.0.1/',
  visibilityState: 'visible',
  hasFocus: () => true,
  createElement: () => ({ style: {}, remove() {}, appendChild() {} }),
  head: { appendChild() {} },
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
}
globalThis.localStorage = { getItem: () => null, setItem: () => {} }
globalThis.fetch = async () => ({ ok: true, json: async () => ({}) })
globalThis.EventSource = class {
  close() {}
}
globalThis.Notification = undefined

try {
  new Function(source)()
} catch (error) {
  console.error('SCRIPT_THROW:', error)
  process.exitCode = 1
}

if (factoryResult) {
  console.log('FACTORY_OK keys=', Object.keys(factoryResult).join(','))
  try {
    factoryResult.apply({ get: () => undefined, on: () => () => {}, effect: () => () => {}, slots: { inject: () => () => {}, register: () => () => {} }, locale: { getLocale: () => ({ id: 'zh' }) }, logger: console })
    console.log('APPLY_OK')
  } catch (error) {
    console.error('APPLY_THROW:', error)
    process.exitCode = 1
  }
}
