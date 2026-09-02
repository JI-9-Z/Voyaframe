import type { Language, Location } from '../types'

const messages = {
  zh: {
    tripName: '行程名称', routeAndTransport: '行程路线', stops: '站', addLocation: '＋ 添加地点',
    animationSpeed: '动画速度', mapTheme: '地图主题', fast: '快速 · 2秒', standard: '标准 · 4秒', slow: '慢速 · 6秒',
    play: '播放', pause: '暂停', replay: '重新播放', exportVideo: '导出视频', browserRecording: '视频将在当前设备中生成',
    localDemo: '本地演示', language: '语言', chinese: '中文', english: 'English', toward: '前往',
    plane: '飞机', car: '汽车', train: '火车', ship: '轮船', moveUp: '上移', moveDown: '下移', remove: '删除',
    addDestination: '选择下一站', localCities: ' 个城市可搜索', close: '关闭',
    searchPlaceholder: '搜索中文、英文、拼音、国家或省份…', noResults: '没有找到匹配城市', resultLimit: '为保证流畅，每次最多显示前 120 条结果，请输入关键词继续筛选。',
    ready: '准备就绪', playing: '播放中', paused: '已暂停', completed: '行程完成', recording: '正在录制', leg: '航段',
    zoomIn: '放大地球', zoomOut: '缩小地球', reset: '复位', fullscreen: '全屏', gesture: '拖拽旋转 · 双指或滚轮缩放', canvasLabel: '可旋转缩放的 3D 地球旅行路线动画',
    exportFailed: '无法导出视频', generating: '正在生成旅行视频', keepOpen: '请保持此页面打开。完成后文件会自动下载。', cancelExport: '取消导出',
    unsupported: '当前浏览器不支持 Canvas 视频录制。建议使用最新版 Chrome 或 Edge；iPhone/iPad 可先播放，再使用系统录屏。', cannotStart: '无法开始录制', unsupportedShort: '不支持',
    openEditor: '打开行程编辑器', closeEditor: '收起行程编辑器', installApp: '安装帧足记', installHint: '添加到主屏幕，获得接近 App 的全屏体验。', install: '安装', offlineMode: '当前处于离线模式，已缓存的应用和行程仍可使用。', updateReady: '发现新版本', updateHint: '刷新即可应用最新功能。', refresh: '刷新', mobileRecording: '视频将在当前设备中按所选画幅生成。',
    legSettings: '航段设置', duration: '行驶时长', holdDuration: '到达停留', cameraZoom: '镜头倍率', routeStyle: '路线样式', labelTiming: '城市名称', glow: '发光', clean: '简洁', dashed: '虚线', always: '始终显示', arrival: '到达时显示', seconds: '秒', outputFrame: '导出画幅', workspaceTools: '行程工具', templates: '路线模板', chooseTemplate: '选择模板', applyTemplate: '应用模板', undo: '撤销上一步', exportTrip: '备份 JSON', importTrip: '导入 JSON', invalidTripFile: '无法读取此行程文件，请选择由帧足记导出的 JSON。', dragToReorder: '拖动调整顺序',
    storyStudio: '成片故事', subtitle: '片头副标题', traveler: '旅行者署名', introDuration: '片头时长', outroDuration: '片尾时长', showStats: '片尾显示旅行统计', backgroundMusic: '背景音乐', chooseMusic: '选择本地音乐', replaceMusic: '更换音乐', removeMusic: '移除音乐', musicVolume: '音乐音量', mediaStoredLocally: '照片与音乐仅保存在当前设备，并会随 JSON 备份导出。', locationStory: '地点故事', travelDate: '旅行日期', storyNote: '旅行文字', storyPlaceholder: '写下一句关于这一站的记忆…', locationPhoto: '地点照片', choosePhoto: '选择照片', replacePhoto: '更换照片', removePhoto: '移除照片', mediaError: '媒体文件保存失败，请检查浏览器存储空间。', journeySummary: '旅程回顾', citiesStat: '城市', countriesStat: '国家和地区', distanceStat: '总里程', legsStat: '航段', byTraveler: '记录者', intro: '片头', outro: '片尾',
  },
  en: {
    tripName: 'Trip name', routeAndTransport: 'Itinerary', stops: 'stops', addLocation: '+ Add location',
    animationSpeed: 'Animation speed', mapTheme: 'Map theme', fast: 'Fast · 2 sec', standard: 'Standard · 4 sec', slow: 'Slow · 6 sec',
    play: 'Play', pause: 'Pause', replay: 'Replay', exportVideo: 'Export video', browserRecording: 'Video is created on this device',
    localDemo: 'LOCAL DEMO', language: 'Language', chinese: '中文', english: 'English', toward: 'To',
    plane: 'Plane', car: 'Car', train: 'Train', ship: 'Ship', moveUp: 'Move up ', moveDown: 'Move down ', remove: 'Remove ',
    addDestination: 'Choose the next stop', localCities: ' cities available', close: 'Close',
    searchPlaceholder: 'Search Chinese, English, pinyin, country or province…', noResults: 'No matching cities', resultLimit: 'For performance, up to 120 results are shown. Type to narrow the list.',
    ready: 'Ready', playing: 'Playing', paused: 'Paused', completed: 'Trip completed', recording: 'Recording', leg: 'Leg',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset', fullscreen: 'Fullscreen', gesture: 'Drag to rotate · pinch or wheel to zoom', canvasLabel: 'Rotatable 3D globe travel animation',
    exportFailed: 'Unable to export video', generating: 'Generating travel video', keepOpen: 'Keep this page open. The file downloads automatically when complete.', cancelExport: 'Cancel export',
    unsupported: 'Canvas recording is unavailable here. Try the latest Chrome or Edge; on iPhone/iPad, play the animation and use screen recording.', cannotStart: 'Unable to start recording', unsupportedShort: 'Unsupported',
    openEditor: 'Open trip editor', closeEditor: 'Close trip editor', installApp: 'Install VoyaFrame', installHint: 'Add it to your home screen for an app-like fullscreen experience.', install: 'Install', offlineMode: 'You are offline. The cached app and saved trip remain available.', updateReady: 'Update available', updateHint: 'Refresh to use the latest version.', refresh: 'Refresh', mobileRecording: 'Video is created on this device in the selected frame.',
    legSettings: 'Leg settings', duration: 'Travel time', holdDuration: 'Arrival hold', cameraZoom: 'Camera zoom', routeStyle: 'Route style', labelTiming: 'City labels', glow: 'Glow', clean: 'Clean', dashed: 'Dashed', always: 'Always visible', arrival: 'On arrival', seconds: 'sec', outputFrame: 'Output frame', workspaceTools: 'Trip tools', templates: 'Route templates', chooseTemplate: 'Choose a template', applyTemplate: 'Use template', undo: 'Undo last change', exportTrip: 'Back up JSON', importTrip: 'Import JSON', invalidTripFile: 'This trip file could not be read. Choose a JSON exported by VoyaFrame.', dragToReorder: 'Drag to reorder',
    storyStudio: 'Story studio', subtitle: 'Opening subtitle', traveler: 'Traveler credit', introDuration: 'Opening length', outroDuration: 'Closing length', showStats: 'Show journey stats at the end', backgroundMusic: 'Background music', chooseMusic: 'Choose local music', replaceMusic: 'Replace music', removeMusic: 'Remove music', musicVolume: 'Music volume', mediaStoredLocally: 'Photos and music stay on this device and are included in JSON backups.', locationStory: 'Stop story', travelDate: 'Travel date', storyNote: 'Travel note', storyPlaceholder: 'Write one memory from this stop…', locationPhoto: 'Stop photo', choosePhoto: 'Choose photo', replacePhoto: 'Replace photo', removePhoto: 'Remove photo', mediaError: 'The media file could not be saved. Check browser storage space.', journeySummary: 'Journey recap', citiesStat: 'Cities', countriesStat: 'Regions', distanceStat: 'Distance', legsStat: 'Legs', byTraveler: 'By', intro: 'Opening', outro: 'Closing',
  },
} as const

export type MessageKey = keyof typeof messages.zh
export const t = (language: Language, key: MessageKey): string => messages[language][key]
export const locationName = (location: Pick<Location, 'name' | 'nameEn'>, language: Language): string => language === 'en' ? location.nameEn || location.name : location.name
export const locationCountry = (location: Pick<Location, 'country' | 'countryEn'>, language: Language): string => language === 'en' ? location.countryEn || location.country : location.country
