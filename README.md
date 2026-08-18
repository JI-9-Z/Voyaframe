# 帧足记 VoyaFrame

帧足记（VoyaFrame）是一个纯浏览器端的旅行路线动画 Web Demo。用户可以编辑多个旅行地点，在 3D 卫星地球上播放不同载具沿分段路线移动的动画，并直接录制为视频下载。

项目不使用后端、数据库、收费 API 或 API Key。地图数据、城市数据库、动画计算和视频录制均在本地完成。

## 快速启动

需要 Node.js 20.19+ 或 22.12+（推荐使用当前 LTS）。

```bash
npm install
npm run dev
```

根据终端输出打开本地地址，通常为 `http://localhost:5173`。

普通生产构建：

```bash
npm run build
npm run preview
```

生成可直接上传到静态托管平台的版本：

```bash
npm run verify:static
```

完成后，将 `dist/` 目录中的全部内容上传到网站根目录。该命令会额外生成 SPA 回退页，并根据 `.env.production` 中的正式域名生成 `robots.txt` 和 `sitemap.xml`。

## 中国大陆部署

项目可以直接部署到国内对象存储与 CDN。代码库已包含：

- `.env.production.example`：正式域名、运营主体、ICP 与公安备案配置；
- `npm run verify:static`：允许备案信息暂缺的静态部署包检查；
- `npm run verify:release`：要求正式域名、主体与 ICP 信息完整的严格上线检查；
- `deploy/nginx.conf`：自建静态服务器的安全头、SPA 回退和缓存参考；
- `deploy/TENCENT_COS_STATIC.md`：腾讯云 COS 的上传、首页、错误页、缓存和安全头配置；
- 页脚备案展示、隐私政策和使用条款。

完整操作步骤见 [腾讯云 COS 静态托管配置](deploy/TENCENT_COS_STATIC.md) 和 [中国大陆上线手册](docs/DEPLOY_CHINA.md)；个人主体使用腾讯云时可按照 [腾讯云个人上线清单](docs/TENCENT_CLOUD_ONBOARDING.md) 操作。正式备案号获批前不要填写或展示虚假备案信息。

## 已实现功能

- 首次打开加载「环游世界 2026」默认路线：北京 → 巴黎 → 纽约 → 东京
- 可拖拽旋转、滚轮和按钮缩放的 3D 球形地球
- 本地打包的 NASA Blue Marble 卫星影像与 Natural Earth 国界，无远程地图 API
- 基于球面大圆插值的跨日期变更线路线
- 飞机采用大圆航线；汽车、火车和轮船采用确定性弯折路径
- 已完成、当前、未完成三种路线状态
- 飞机、汽车、火车和轮船图形，方向跟随路线切线
- 到达标记光圈、城市名称、当前航段信息和统一进度条
- 全行程、当前航段与下一航段之间的镜头缩放/平移
- 基于单一 `requestAnimationFrame` 时间轴的播放、暂停、继续、重播和拖动定位
- 快速（2 秒）、标准（4 秒）、慢速（6 秒）三档航段速度，每段后停留 1 秒
- 2500 个 GeoNames 全球主要城市，加上中国完整地级层级数据与精选中文城市；去重后共 2632 个本地城市
- 中国数据新增 372 条带中心坐标的地级层级、直辖市和港澳记录，覆盖大陆全部地级行政区
- 中文、英文界面一键切换，语言选择随行程保存
- 城市搜索同时支持中文、英文、拼音、国家和省份，例如 `石家庄`、`Shijiazhuang`、`shi jia zhuang` 均可命中
- 每一段行程可独立选择飞机、汽车、火车或轮船
- Midnight、Ocean、Minimal Light 三种地图主题
- `localStorage` 自动保存最近编辑的行程
- `Canvas.captureStream()` + `MediaRecorder` 录制 1280×720、16:9 视频
- 录制进度、取消导出和完成后自动下载
- 桌面双栏布局、平板适配和手机底部编辑面板

## 视频格式说明

Demo 会根据浏览器实际支持的 MediaRecorder MIME 类型选择格式：

1. 浏览器支持 `video/mp4;codecs=avc1` 时导出 MP4。
2. 否则按顺序尝试 VP9 WebM、VP8 WebM 和通用 WebM。
3. 文件扩展名始终与实际录制格式一致，不会把 WebM 伪装成 MP4。

当前 Demo 使用浏览器端录制，视频格式取决于浏览器。正式版本可通过服务器 FFmpeg 统一导出 MP4。推荐使用最新版 Chrome 或 Edge；Safari、Firefox 及不同操作系统支持的编码器可能不同。

## 项目结构

```text
src/
  components/
    TripEditor.tsx             左侧/底部行程编辑器
    LocationList.tsx           地点排序与删除
    LocationSelector.tsx       内置城市选择器
    MapCanvas.tsx              3D 地球、地图与动画画布
    TimelineControls.tsx       时间轴与播放控制
    TripInfoCard.tsx           预览状态卡片
    ExportDialog.tsx           导出进度与错误提示
  data/
    cityDatabase.ts            内置城市和默认行程
    globalCities.json          GeoNames 全球主要城市（2500 条）
    chinaPrefectureCities.json 中国地级层级城市、拼音、行政区代码与坐标
  hooks/
    useTripAnimation.ts        requestAnimationFrame 时间轴
    useCanvasRenderer.ts       Canvas 重绘循环
    useVideoRecorder.ts        录制状态封装
  lib/
    coordinateProjection.ts    Canvas 点类型
    globeGeometry.ts           球面中心、大圆与镜头插值
    tripModel.ts               航段模型与数据迁移
    animationTimeline.ts       统一时间轴状态计算
    i18n.ts                    中英文界面文案与地点显示名称
  renderers/
    RouteRenderer.ts           路线样式绘制
    VehicleRenderer.ts         交通工具绘制
  services/
    localStorageService.ts     行程持久化
    recordingService.ts        captureStream 与 MediaRecorder
  App.tsx                      应用状态和模块编排
public/
  earth-blue-marble.jpg        NASA Blue Marble 本地卫星影像
```

## 技术说明

- 地图采用 `d3-geo` 正射投影，将本地卫星影像通过三角网格映射到 Canvas 球面，并叠加经纬网与国界。
- 卫星底图来自 NASA Earth Observatory 的 Blue Marble Next Generation，文件随项目本地加载；国界来自 `world-atlas` 内置的 Natural Earth 1:110m TopoJSON。应用运行时不调用地图 API，也不需要 API Key。
- 城市基础数据来自 GeoNames `cities15000`，项目选取其中人口较多的 2500 个城市并离线打包；原有精选城市保留中文名称并优先展示。
- 航线使用球面大圆插值，因此跨越 ±180° 日期变更线时自然走最短路径。
- 汽车、火车、轮船路线是在球面最短路径基础上加入与交通工具相关的平滑偏移，形成可复现的弯折视觉路径；它们不是道路、铁路或航运导航结果。
- 播放时镜头会快速切入当前航段的稳定机位；航段内地球尽量保持静止，仅在航段切换和最终定格时平滑过渡，并采用更近的默认缩放突出交通工具。
- 拖拽会调整球体旋转，滚轮或右上角按钮可在 70%–165% 范围缩放；开始播放或重播时会清除手动视角偏移并恢复自动镜头。播放和录制期间手动镜头控制会暂时锁定。
- 每一帧都从当前绝对时间重新计算航段、进度、载具位置、路线状态和镜头，不使用一组独立 `setTimeout`。
- UI 预览与录制共用同一个固定分辨率 Canvas；左侧编辑器和 HTML 控件不会进入视频画面。
- Natural Earth 1:110m 数据适合全球视图，但仍是制图简化数据，不适合街道级导航或测绘分析。

## 已知限制

- MediaRecorder 编码能力、最大稳定录制时长和 MP4 支持由浏览器及操作系统决定。
- 浏览器端录制按实时速度执行，导出 20 秒动画约需 20 秒，页面必须保持打开。
- 切换后台标签页后浏览器可能降低 `requestAnimationFrame` 频率，从而延长录制时间。
- 当前城市库为离线固定数据，不提供地址搜索、地理编码或自定义坐标输入。
- 中国城市英文显示名采用标准拼音形式；少数国际城市使用常见英文名。中国行政区中心坐标来自 GCJ-02 数据，在全球动画比例下可用，但不应作为测绘级 WGS84 坐标。
- 卫星底图是全球合成影像，不是实时卫星图，也不支持街道级瓦片细节。
- 汽车、铁路和轮船路线为视觉近似，并非真实道路、铁路或航运线路。若要提供真实路线，需要后续接入 OSRM、Valhalla、GraphHopper 等路由服务及对应交通网络数据。
- Demo 不包含音频、字幕、服务端渲染和 FFmpeg 转码。

## 数据来源与许可

- 卫星影像：[NASA Earth Observatory — Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/)。
- 城市数据：[GeoNames](https://www.geonames.org/)，依据 [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。
- 中国行政区与中心坐标：[AreaCity-JsSpider-StatsGov](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov)，MIT License；本项目使用其 2026-04-03 发布的三级行政区数据，并精简为本地城市索引。
- 国界数据：`world-atlas` / Natural Earth 1:110m。
