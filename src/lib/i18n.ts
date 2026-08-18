import type { Language, Location } from '../types'

const messages = {
  zh: {
    tripName: '行程名称', routeAndTransport: '旅行地点与分段交通', stops: '站', addLocation: '＋ 添加地点',
    animationSpeed: '动画速度', mapTheme: '地图主题', fast: '快速 · 2秒', standard: '标准 · 4秒', slow: '慢速 · 6秒',
    play: '播放', pause: '暂停', replay: '重新播放', exportVideo: '导出视频', browserRecording: '浏览器端 1280 × 720 · 16:9 录制',
    localDemo: '本地演示', language: '语言', chinese: '中文', english: 'English', toward: '前往',
    plane: '飞机', car: '汽车', train: '火车', ship: '轮船', moveUp: '上移', moveDown: '下移', remove: '删除',
    addDestination: '添加下一个目的地', localCities: '个本地城市 · 无需地图 API', close: '关闭',
    searchPlaceholder: '搜索中文、英文、拼音、国家或省份…', noResults: '没有找到匹配城市', resultLimit: '为保证流畅，每次最多显示前 120 条结果，请输入关键词继续筛选。',
    ready: '准备就绪', playing: '播放中', paused: '已暂停', completed: '行程完成', recording: '正在录制', leg: '航段',
    zoomIn: '放大地球', zoomOut: '缩小地球', reset: '复位', fullscreen: '全屏', gesture: '拖拽旋转 · 滚轮缩放', canvasLabel: '可旋转缩放的 3D 地球旅行路线动画',
    exportFailed: '无法导出视频', generating: '正在生成旅行视频', keepOpen: '请保持此页面打开。完成后文件会自动下载。', cancelExport: '取消导出',
    unsupported: '当前浏览器不支持 Canvas 视频录制，请使用最新版 Chrome、Edge 或 Firefox。', cannotStart: '无法开始录制', unsupportedShort: '不支持',
  },
  en: {
    tripName: 'Trip name', routeAndTransport: 'Stops & leg transport', stops: 'stops', addLocation: '+ Add location',
    animationSpeed: 'Animation speed', mapTheme: 'Map theme', fast: 'Fast · 2 sec', standard: 'Standard · 4 sec', slow: 'Slow · 6 sec',
    play: 'Play', pause: 'Pause', replay: 'Replay', exportVideo: 'Export video', browserRecording: 'Browser recording · 1280 × 720 · 16:9',
    localDemo: 'LOCAL DEMO', language: 'Language', chinese: '中文', english: 'English', toward: 'To',
    plane: 'Plane', car: 'Car', train: 'Train', ship: 'Ship', moveUp: 'Move up ', moveDown: 'Move down ', remove: 'Remove ',
    addDestination: 'Add your next destination', localCities: ' local cities · no map API', close: 'Close',
    searchPlaceholder: 'Search Chinese, English, pinyin, country or province…', noResults: 'No matching cities', resultLimit: 'For performance, up to 120 results are shown. Type to narrow the list.',
    ready: 'Ready', playing: 'Playing', paused: 'Paused', completed: 'Trip completed', recording: 'Recording', leg: 'Leg',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset', fullscreen: 'Fullscreen', gesture: 'Drag to rotate · wheel to zoom', canvasLabel: 'Rotatable 3D globe travel animation',
    exportFailed: 'Unable to export video', generating: 'Generating travel video', keepOpen: 'Keep this page open. The file downloads automatically when complete.', cancelExport: 'Cancel export',
    unsupported: 'This browser cannot record Canvas video. Use the latest Chrome, Edge, or Firefox.', cannotStart: 'Unable to start recording', unsupportedShort: 'Unsupported',
  },
} as const

export type MessageKey = keyof typeof messages.zh
export const t = (language: Language, key: MessageKey): string => messages[language][key]
export const locationName = (location: Pick<Location, 'name' | 'nameEn'>, language: Language): string => language === 'en' ? location.nameEn || location.name : location.name
export const locationCountry = (location: Pick<Location, 'country' | 'countryEn'>, language: Language): string => language === 'en' ? location.countryEn || location.country : location.country
