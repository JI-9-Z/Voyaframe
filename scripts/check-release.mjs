import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const envPath = resolve(root, '.env.production')
const wantsDistCheck = process.argv.includes('--dist')
const allowIncompleteCompliance = process.argv.includes('--allow-incomplete-compliance')
const failures = []
const warnings = []

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
    const index = line.indexOf('=')
    return index < 0 ? [line, ''] : [line.slice(0, index).trim(), line.slice(index + 1).trim()]
  }))
}

if (!existsSync(envPath)) {
  const message = '缺少 .env.production；部署正式域名前请复制 .env.production.example 后填写。'
  if (allowIncompleteCompliance) warnings.push(message)
  else failures.push(message)
} else {
  const env = parseEnv(readFileSync(envPath, 'utf8'))
  const required = ['VITE_SITE_URL', 'VITE_OPERATOR_NAME', 'VITE_CONTACT_EMAIL', 'VITE_ICP_NUMBER']
  for (const key of required) {
    const value = env[key] || ''
    if (!value || /example\.com|请填写/.test(value)) {
      const message = `${key} 尚未填写真实值。`
      if (allowIncompleteCompliance) warnings.push(message)
      else failures.push(message)
    }
  }
  if (env.VITE_SITE_URL && !/^https:\/\//.test(env.VITE_SITE_URL)) failures.push('VITE_SITE_URL 必须使用 HTTPS。')
  if (env.VITE_CONTACT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.VITE_CONTACT_EMAIL)) failures.push('VITE_CONTACT_EMAIL 格式不正确。')
  if (!env.VITE_PUBLIC_SECURITY_NUMBER) warnings.push('公安备案号尚未配置；网站开通并完成公安备案后补充。')
}

for (const file of ['public/earth-blue-marble.jpg', 'public/favicon.svg', 'public/robots.txt']) {
  if (!existsSync(resolve(root, file))) failures.push(`缺少生产资源：${file}`)
}

if (wantsDistCheck) {
  const indexPath = resolve(root, 'dist/index.html')
  if (!existsSync(indexPath)) failures.push('未找到 dist/index.html，请先运行 npm run build。')
  if (!existsSync(resolve(root, 'dist/404.html'))) failures.push('未找到 dist/404.html，请使用 npm run build:static 生成静态托管包。')
  if (!existsSync(resolve(root, 'dist/site.webmanifest'))) failures.push('生产产物缺少 site.webmanifest。')
  const mapPath = resolve(root, 'dist/earth-blue-marble.jpg')
  if (!existsSync(mapPath) || statSync(mapPath).size < 100_000) failures.push('生产产物中的卫星地图缺失或异常。')
}

for (const warning of warnings) console.warn(`警告：${warning}`)
if (failures.length) {
  for (const failure of failures) console.error(`失败：${failure}`)
  process.exitCode = 1
} else {
  console.log('帧足记 VoyaFrame 上线配置检查通过。')
}
