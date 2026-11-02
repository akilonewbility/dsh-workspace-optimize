/**
 * 只读探针：在 DSH 的 app.asar 中查找字符串并打印上下文，用于排查更新阻塞。
 * 用法：node scripts/asar-probe.mjs "keyword1" "keyword2" ...
 */
import { readFileSync } from 'node:fs'

const ASAR = 'D:/Program Files/Deepseek Harness/resources/app.asar'
const raw = readFileSync(ASAR).toString('latin1')
const keywords = process.argv.slice(2)
for (const keyword of keywords) {
  let index = raw.indexOf(keyword)
  let count = 0
  while (index >= 0 && count < 3) {
    console.log(`[${keyword}] @${index}: ${JSON.stringify(raw.slice(Math.max(0, index - 260), index + 620))}`)
    index = raw.indexOf(keyword, index + 1)
    count += 1
  }
  console.log('---')
}
