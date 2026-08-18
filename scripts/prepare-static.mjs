import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const dist = resolve(root, 'dist')
const indexPath = resolve(dist, 'index.html')

if (!existsSync(indexPath)) {
  console.error('未找到 dist/index.html，请先运行 npm run build。')
  process.exit(1)
}

// 兼容把自定义错误页指向 404.html 的静态托管平台；COS 仍建议把错误文档设为 index.html、响应码设为 200。
copyFileSync(indexPath, resolve(dist, '404.html'))

function readProductionEnv() {
  const envPath = resolve(root, '.env.production')
  if (!existsSync(envPath)) return {}
  return Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
    const separator = line.indexOf('=')
    return separator < 0 ? [line, ''] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]
  }))
}

const env = readProductionEnv()
const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '')
const validSiteUrl = /^https:\/\/[^\s/]+(?:\/.*)?$/.test(siteUrl) && !siteUrl.includes('example.com')
const robots = ['User-agent: *', 'Allow: /', validSiteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ''].filter(Boolean).join('\n') + '\n'
writeFileSync(resolve(dist, 'robots.txt'), robots)

if (validSiteUrl) {
  const escapedUrl = siteUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapedUrl}/</loc></url>\n</urlset>\n`)
}

console.log('静态部署目录已准备完成：dist/（包含 SPA 回退页和搜索引擎文件）。')
