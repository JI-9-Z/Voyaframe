# 腾讯云 COS 静态网站配置

本文件与 `dist/` 一起作为发布交付物。当前应用是纯前端应用，不需要服务器运行 Node.js。

## 构建

在项目根目录创建 `.env.production`，至少先填写正式域名和公开联系邮箱：

```dotenv
VITE_SITE_URL=https://www.example.com
VITE_PUBLIC_BASE=/
VITE_OPERATOR_NAME=个人备案主体姓名
VITE_CONTACT_EMAIL=jjunzhe@zju.edu.cn
VITE_ICP_NUMBER=
VITE_PUBLIC_SECURITY_NUMBER=
VITE_PUBLIC_SECURITY_URL=
```

然后运行：

```powershell
npm ci
npm run verify:static
```

上传 `dist/` **里面的全部文件**到存储桶根目录，不要把 `dist` 文件夹本身再套一层上传。

## COS 控制台设置

1. 创建与备案接入地域相符的中国大陆 COS 存储桶。
2. 开启“静态网站”，强制 HTTPS 建议开启。
3. 索引文档：`index.html`。
4. 错误文档：`index.html`，错误文档响应码：`200`。
5. 添加自定义源站域名，源站类型选择“静态网站源站”。
6. 按控制台给出的 CNAME 值配置 DNS，并为自定义域名绑定 HTTPS 证书。
7. 若直接公开源站，存储桶设为“公有读私有写”；若使用 CDN 回源鉴权，可保持私有读写。

2024 年起新建存储桶不应依赖 COS 默认域名直接预览网站，正式访问应使用已绑定的自定义域名。

## 缓存规则

在 COS 对象元数据或 CDN 缓存规则中配置：

| 匹配路径 | Cache-Control |
|---|---|
| `/index.html`、`/404.html` | `no-cache, no-store, must-revalidate` |
| `/assets/*` | `public, max-age=31536000, immutable` |
| `/earth-blue-marble.jpg` | `public, max-age=2592000` |
| `/favicon.svg`、`/site.webmanifest` | `public, max-age=86400` |

每次发布后只需刷新 CDN 中的 `/index.html`、`/404.html`、`/robots.txt` 和 `/sitemap.xml`；带内容哈希的 `assets/` 文件可长期缓存。

## 安全响应头

如果使用 CDN，在“HTTP 响应头配置”中增加：

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

## 上线前最后检查

取得 ICP 备案号并填入 `.env.production` 后，运行严格校验：

```powershell
npm run verify:release
```

未取得备案号前，可以生成并上传测试包，但不要把未备案域名解析到中国大陆公网资源并公开提供服务。
