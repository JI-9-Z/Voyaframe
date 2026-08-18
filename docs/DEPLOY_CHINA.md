# 帧足记 VoyaFrame 中国大陆上线手册

本文用于将当前纯前端版本部署到中国大陆的对象存储、CDN 或静态服务器。它是工程准备清单，不替代云厂商、通信管理局或法律专业人士的正式意见。

## 1. 推荐架构

当前版本没有后端，推荐使用以下架构：

```text
用户
  ↓ HTTPS
已备案域名
  ↓
中国大陆 CDN
  ↓
对象存储静态网站（OSS / COS / OBS）
  ↓
dist/ 生产文件
```

第一版不需要购买云服务器或数据库。使用对象存储和 CDN 能减少运维工作，并可利用国内节点加速 1.6 MB 的卫星地图资源。

如果后续增加账号、云端行程和服务端视频导出，再引入 API 服务、数据库、对象存储私有桶和 FFmpeg 任务队列。

## 2. 需要运营者本人准备的资料

- 已实名认证的域名；建议同时持有 `.cn` 或常见通用顶级域名。
- 与备案主体一致的中国大陆云账号。
- 备案主体资料：个人身份信息，或企业营业执照、法定代表人及网站负责人资料。
- 可长期接收验证信息的手机号和邮箱。
- 运营主体全称和公开联系邮箱。
- ICP 备案通过后获得的备案号。
- 网站开通后，根据属地主管机关要求办理公安联网备案，并取得公安备案号和链接。

域名、云资源和备案主体应尽量保持一致。具体材料、核验方式和时限以接入商备案系统及主体所在地通信管理局要求为准。

## 3. 生产环境变量

复制示例文件：

```powershell
Copy-Item .env.production.example .env.production
```

然后填写：

```dotenv
VITE_SITE_URL=https://你的正式域名
VITE_PUBLIC_BASE=/
VITE_OPERATOR_NAME=备案主体全称
VITE_CONTACT_EMAIL=公开联系邮箱
VITE_ICP_NUMBER=省份简称ICP备案号
VITE_PUBLIC_SECURITY_NUMBER=
VITE_PUBLIC_SECURITY_URL=
```

注意：所有 `VITE_` 开头的值都会进入浏览器可读取的前端文件，不能填写密码、AccessKey、SecretKey 或其他密钥。

如果网站部署到域名根目录，`VITE_PUBLIC_BASE=/`。如果必须部署到子目录 `/voyaframe/`，填写：

```dotenv
VITE_PUBLIC_BASE=/voyaframe/
```

## 4. 构建和检查

建议使用当前 Node.js LTS：

```powershell
npm ci
npm run check:release
npm run build
```

或者执行完整检查：

```powershell
npm run verify:release
```

`check:release` 会检查：

- 正式域名是否为 HTTPS；
- 运营主体、邮箱和 ICP 备案号是否已填写；
- 必需地图和图标资源是否存在；
- 使用 `--dist` 时，生产产物及卫星地图是否完整；
- 公安备案信息是否仍待补充。

通过后，将整个 `dist/` 目录上传到对象存储静态站点根目录。

## 5. 对象存储和 CDN 配置

阿里云 OSS、腾讯云 COS、华为云 OBS 均可使用。无论选择哪家，至少设置：

1. 开启静态网站托管，默认首页为 `index.html`。
2. 错误页或 SPA 回源页设置为 `index.html`。
3. 绑定已备案域名。
4. 开启 CDN 和 HTTPS，并设置 HTTP 自动跳转 HTTPS。
5. TLS 最低版本建议为 TLS 1.2。
6. 开启 Gzip/Brotli（平台支持时）。
7. 不要开放对象存储目录列表。
8. 云端 AccessKey 只存放在云平台或 CI 密钥中，不得写入 `.env.production`。

推荐缓存规则：

| 路径 | Cache-Control | 原因 |
|---|---|---|
| `/index.html` | `no-cache, no-store, must-revalidate` | 每次检查是否有新版本 |
| `/assets/*` | `public, max-age=31536000, immutable` | 文件名带内容哈希，可长期缓存 |
| `*.jpg, *.svg, *.png` | `public, max-age=2592000` | 地图和图标按月缓存 |
| `/robots.txt` | `public, max-age=86400` | 每日刷新 |

如果使用云服务器部署静态文件，可以参考 [`deploy/nginx.conf`](../deploy/nginx.conf)。生产环境还应由负载均衡、CDN 或 Nginx 终止 HTTPS。

## 6. DNS 与证书

- 建议主站使用 `www.你的域名`，根域名 301 跳转到主站，或反向设置但必须全站唯一。
- CDN 完成配置后再修改 DNS，避免备案核验期间指向错误资源。
- 开启证书到期提醒和自动续签。
- 上线后检查 HTTP、HTTPS、根域名和 `www` 四种访问方式，确保最终只保留一个规范地址。

## 7. 页面备案与合规

项目已经提供以下能力：

- 页脚显示 ICP 备案号并链接到工信部备案系统；
- 可选显示公安备案号和指定链接；
- `#/privacy` 隐私政策；
- `#/terms` 使用条款；
- 数据来源和许可继续保留在 README。

在正式发布前应人工确认：

- 隐私政策中的运营主体和邮箱真实有效；
- 当前确实未启用未披露的统计、广告或错误监控 SDK；
- 如果后来启用用户账号、云同步、统计、Cookie 或第三方 SDK，先更新隐私政策；
- 首页底部备案号与备案系统完全一致；
- 网站名称、服务内容和备案申请内容一致；
- 地图仅用于全球旅行可视化，不作为测绘和导航服务宣传；
- 用户生成内容和公开分享功能上线前另行评估内容治理要求。

## 8. 安全配置

`deploy/nginx.conf` 已提供以下基础响应头：

- Content Security Policy；
- `X-Content-Type-Options: nosniff`；
- Referrer Policy；
- Permissions Policy；
- HTML 不缓存、哈希资源长期缓存。

对象存储或 CDN 部署时，应在 CDN 响应头规则中配置同等策略。当前 CSP 禁止第三方脚本和 iframe 嵌入；以后若接入统计或小程序 WebView，需要按最小范围调整，不能直接改成允许任意来源。

## 9. 上线验收

至少使用以下环境测试：

- Windows：最新版 Chrome、Edge；
- macOS：Safari、Chrome；
- Android：Chrome、微信内置浏览器；
- iPhone/iPad：Safari、微信内置浏览器；
- 一台性能较低的安卓手机。

测试流程：

1. 首屏地图和默认路线正常加载。
2. 中英文搜索和 2632 个城市可用。
3. 拖动、缩放、播放、暂停、重播正常。
4. 每段交通工具和镜头切换正常。
5. 刷新后行程保留。
6. 视频导出格式和扩展名一致。
7. 不支持录制时有清晰提示。
8. 隐私政策、使用条款、ICP备案链接可访问。
9. 浏览器控制台无持续错误。
10. 弱网环境下地图加载失败不会导致整个页面崩溃。

## 10. 发布和回滚

- 每次发布前保留上一版 `dist` 压缩包或对象存储版本。
- 先部署到测试域名，再切换正式域名。
- 正式发布后清除 `/index.html` CDN 缓存；带哈希的 `/assets/` 不需要全量刷新。
- 发生严重问题时恢复上一版 `dist`，再刷新 HTML 缓存。
- 不要删除仍被旧 `index.html` 引用的历史哈希资源，直到边缘缓存自然失效。

## 11. 当前仍需补充的商业决策

- 备案主体使用个人还是企业；
- 选择阿里云、腾讯云或其他中国大陆接入商；
- 正式域名；
- 是否需要统计与错误监控；
- 是否需要用户账号和云端同步；
- 视频是否继续浏览器端生成，还是建设服务端 MP4 导出。

## 12. 官方参考

- [工信部《非经营性互联网信息服务备案管理办法》](https://www.miit.gov.cn/gyhxxhb/jgsj/cyzcyfgs/bmgz/xxtxl/art/2024/art_84a0cfa0ebd049bbbe751dca9a008e56.html)
- [工信部 ICP/IP 地址/域名信息备案管理系统](https://beian.miit.gov.cn/)
- [Vite 静态部署指南](https://vite.dev/guide/static-deploy.html)
- [Vite 环境变量与模式](https://vite.dev/guide/env-and-mode.html)
- [Vite 构建配置](https://vite.dev/config/build-options)
