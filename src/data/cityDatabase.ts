import type { Location, Trip } from '../types'
import globalCities from './globalCities.json'
import chinaPrefectureCities from './chinaPrefectureCities.json'

export type City = Omit<Location, 'id'>

const CURATED_CITIES: City[] = [
  { name: '北京', country: '中国', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', country: '中国', latitude: 31.2304, longitude: 121.4737 },
  { name: '广州', country: '中国', latitude: 23.1291, longitude: 113.2644 },
  { name: '深圳', country: '中国', latitude: 22.5431, longitude: 114.0579 },
  { name: '成都', country: '中国', latitude: 30.5728, longitude: 104.0668 },
  { name: '香港', country: '中国', latitude: 22.3193, longitude: 114.1694 },
  { name: '东京', country: '日本', latitude: 35.6895, longitude: 139.6917 },
  { name: '首尔', country: '韩国', latitude: 37.5665, longitude: 126.978 },
  { name: '新加坡', country: '新加坡', latitude: 1.3521, longitude: 103.8198 },
  { name: '曼谷', country: '泰国', latitude: 13.7563, longitude: 100.5018 },
  { name: '悉尼', country: '澳大利亚', latitude: -33.8688, longitude: 151.2093 },
  { name: '迪拜', country: '阿联酋', latitude: 25.2048, longitude: 55.2708 },
  { name: '开罗', country: '埃及', latitude: 30.0444, longitude: 31.2357 },
  { name: '巴黎', country: '法国', latitude: 48.8566, longitude: 2.3522 },
  { name: '伦敦', country: '英国', latitude: 51.5074, longitude: -0.1278 },
  { name: '罗马', country: '意大利', latitude: 41.9028, longitude: 12.4964 },
  { name: '柏林', country: '德国', latitude: 52.52, longitude: 13.405 },
  { name: '纽约', country: '美国', latitude: 40.7128, longitude: -74.006 },
  { name: '洛杉矶', country: '美国', latitude: 34.0522, longitude: -118.2437 },
  { name: '旧金山', country: '美国', latitude: 37.7749, longitude: -122.4194 },
  { name: '多伦多', country: '加拿大', latitude: 43.6532, longitude: -79.3832 },
  { name: '里约热内卢', country: '巴西', latitude: -22.9068, longitude: -43.1729 },
  { name: '台北', country: '中国', latitude: 25.033, longitude: 121.5654 },
  { name: '澳门', country: '中国', latitude: 22.1987, longitude: 113.5439 },
  { name: '杭州', country: '中国', latitude: 30.2741, longitude: 120.1551 },
  { name: '西安', country: '中国', latitude: 34.3416, longitude: 108.9398 },
  { name: '武汉', country: '中国', latitude: 30.5928, longitude: 114.3055 },
  { name: '大阪', country: '日本', latitude: 34.6937, longitude: 135.5023 },
  { name: '京都', country: '日本', latitude: 35.0116, longitude: 135.7681 },
  { name: '札幌', country: '日本', latitude: 43.0618, longitude: 141.3545 },
  { name: '釜山', country: '韩国', latitude: 35.1796, longitude: 129.0756 },
  { name: '吉隆坡', country: '马来西亚', latitude: 3.139, longitude: 101.6869 },
  { name: '雅加达', country: '印度尼西亚', latitude: -6.2088, longitude: 106.8456 },
  { name: '巴厘岛', country: '印度尼西亚', latitude: -8.4095, longitude: 115.1889 },
  { name: '马尼拉', country: '菲律宾', latitude: 14.5995, longitude: 120.9842 },
  { name: '河内', country: '越南', latitude: 21.0278, longitude: 105.8342 },
  { name: '胡志明市', country: '越南', latitude: 10.8231, longitude: 106.6297 },
  { name: '金边', country: '柬埔寨', latitude: 11.5564, longitude: 104.9282 },
  { name: '新德里', country: '印度', latitude: 28.6139, longitude: 77.209 },
  { name: '孟买', country: '印度', latitude: 19.076, longitude: 72.8777 },
  { name: '加德满都', country: '尼泊尔', latitude: 27.7172, longitude: 85.324 },
  { name: '科伦坡', country: '斯里兰卡', latitude: 6.9271, longitude: 79.8612 },
  { name: '墨尔本', country: '澳大利亚', latitude: -37.8136, longitude: 144.9631 },
  { name: '布里斯班', country: '澳大利亚', latitude: -27.4698, longitude: 153.0251 },
  { name: '珀斯', country: '澳大利亚', latitude: -31.9505, longitude: 115.8605 },
  { name: '奥克兰', country: '新西兰', latitude: -36.8509, longitude: 174.7645 },
  { name: '惠灵顿', country: '新西兰', latitude: -41.2866, longitude: 174.7756 },
  { name: '伊斯坦布尔', country: '土耳其', latitude: 41.0082, longitude: 28.9784 },
  { name: '多哈', country: '卡塔尔', latitude: 25.2854, longitude: 51.531 },
  { name: '阿布扎比', country: '阿联酋', latitude: 24.4539, longitude: 54.3773 },
  { name: '利雅得', country: '沙特阿拉伯', latitude: 24.7136, longitude: 46.6753 },
  { name: '特拉维夫', country: '以色列', latitude: 32.0853, longitude: 34.7818 },
  { name: '雅典', country: '希腊', latitude: 37.9838, longitude: 23.7275 },
  { name: '马德里', country: '西班牙', latitude: 40.4168, longitude: -3.7038 },
  { name: '巴塞罗那', country: '西班牙', latitude: 41.3874, longitude: 2.1686 },
  { name: '里斯本', country: '葡萄牙', latitude: 38.7223, longitude: -9.1393 },
  { name: '阿姆斯特丹', country: '荷兰', latitude: 52.3676, longitude: 4.9041 },
  { name: '布鲁塞尔', country: '比利时', latitude: 50.8503, longitude: 4.3517 },
  { name: '维也纳', country: '奥地利', latitude: 48.2082, longitude: 16.3738 },
  { name: '布拉格', country: '捷克', latitude: 50.0755, longitude: 14.4378 },
  { name: '布达佩斯', country: '匈牙利', latitude: 47.4979, longitude: 19.0402 },
  { name: '苏黎世', country: '瑞士', latitude: 47.3769, longitude: 8.5417 },
  { name: '日内瓦', country: '瑞士', latitude: 46.2044, longitude: 6.1432 },
  { name: '哥本哈根', country: '丹麦', latitude: 55.6761, longitude: 12.5683 },
  { name: '斯德哥尔摩', country: '瑞典', latitude: 59.3293, longitude: 18.0686 },
  { name: '奥斯陆', country: '挪威', latitude: 59.9139, longitude: 10.7522 },
  { name: '赫尔辛基', country: '芬兰', latitude: 60.1699, longitude: 24.9384 },
  { name: '雷克雅未克', country: '冰岛', latitude: 64.1466, longitude: -21.9426 },
  { name: '都柏林', country: '爱尔兰', latitude: 53.3498, longitude: -6.2603 },
  { name: '爱丁堡', country: '英国', latitude: 55.9533, longitude: -3.1883 },
  { name: '莫斯科', country: '俄罗斯', latitude: 55.7558, longitude: 37.6173 },
  { name: '圣彼得堡', country: '俄罗斯', latitude: 59.9311, longitude: 30.3609 },
  { name: '开普敦', country: '南非', latitude: -33.9249, longitude: 18.4241 },
  { name: '约翰内斯堡', country: '南非', latitude: -26.2041, longitude: 28.0473 },
  { name: '内罗毕', country: '肯尼亚', latitude: -1.2921, longitude: 36.8219 },
  { name: '马拉喀什', country: '摩洛哥', latitude: 31.6295, longitude: -7.9811 },
  { name: '卡萨布兰卡', country: '摩洛哥', latitude: 33.5731, longitude: -7.5898 },
  { name: '拉各斯', country: '尼日利亚', latitude: 6.5244, longitude: 3.3792 },
  { name: '阿克拉', country: '加纳', latitude: 5.6037, longitude: -0.187 },
  { name: '亚的斯亚贝巴', country: '埃塞俄比亚', latitude: 8.9806, longitude: 38.7578 },
  { name: '突尼斯', country: '突尼斯', latitude: 36.8065, longitude: 10.1815 },
  { name: '温哥华', country: '加拿大', latitude: 49.2827, longitude: -123.1207 },
  { name: '蒙特利尔', country: '加拿大', latitude: 45.5019, longitude: -73.5674 },
  { name: '芝加哥', country: '美国', latitude: 41.8781, longitude: -87.6298 },
  { name: '波士顿', country: '美国', latitude: 42.3601, longitude: -71.0589 },
  { name: '华盛顿', country: '美国', latitude: 38.9072, longitude: -77.0369 },
  { name: '迈阿密', country: '美国', latitude: 25.7617, longitude: -80.1918 },
  { name: '西雅图', country: '美国', latitude: 47.6062, longitude: -122.3321 },
  { name: '拉斯维加斯', country: '美国', latitude: 36.1699, longitude: -115.1398 },
  { name: '檀香山', country: '美国', latitude: 21.3069, longitude: -157.8583 },
  { name: '墨西哥城', country: '墨西哥', latitude: 19.4326, longitude: -99.1332 },
  { name: '哈瓦那', country: '古巴', latitude: 23.1136, longitude: -82.3666 },
  { name: '圣何塞', country: '哥斯达黎加', latitude: 9.9281, longitude: -84.0907 },
  { name: '巴拿马城', country: '巴拿马', latitude: 8.9824, longitude: -79.5199 },
  { name: '波哥大', country: '哥伦比亚', latitude: 4.711, longitude: -74.0721 },
  { name: '利马', country: '秘鲁', latitude: -12.0464, longitude: -77.0428 },
  { name: '圣地亚哥', country: '智利', latitude: -33.4489, longitude: -70.6693 },
  { name: '布宜诺斯艾利斯', country: '阿根廷', latitude: -34.6037, longitude: -58.3816 },
  { name: '圣保罗', country: '巴西', latitude: -23.5505, longitude: -46.6333 },
  { name: '基多', country: '厄瓜多尔', latitude: -0.1807, longitude: -78.4678 },
  { name: '乌斯怀亚', country: '阿根廷', latitude: -54.8019, longitude: -68.303 },
]

const globalList = globalCities as City[]
const curatedEnglishNames: Record<string, string> = {
  澳门: 'Macao', 马尼拉: 'Manila', 巴厘岛: 'Bali', 新德里: 'New Delhi', 特拉维夫: 'Tel Aviv',
  华盛顿: 'Washington, D.C.', 乌斯怀亚: 'Ushuaia', 圣何塞: 'San José', 圣地亚哥: 'Santiago',
}
const enrichedCurated = CURATED_CITIES.map((city) => {
  const match = globalList.find((candidate) => Math.abs(candidate.latitude - city.latitude) < .16 && Math.abs(candidate.longitude - city.longitude) < .16)
  const nameEn = curatedEnglishNames[city.name] ?? match?.name
  const countryEn = city.country === '中国' ? 'China' : match?.country
  return nameEn ? { ...city, nameEn, countryEn, aliases: [nameEn, countryEn ?? ''].filter(Boolean) } : city
})
const chinaList = chinaPrefectureCities as City[]
const globalWithoutChinaDuplicates = globalList.filter((city) => city.country !== 'China' || !chinaList.some((chinaCity) => Math.abs(chinaCity.latitude - city.latitude) < .18 && Math.abs(chinaCity.longitude - city.longitude) < .18))
const seenCities = new Set<string>()
export const CITY_DATABASE: City[] = [...enrichedCurated, ...chinaList, ...globalWithoutChinaDuplicates].filter((city) => {
  const key = `${city.name.toLocaleLowerCase()}|${city.country.toLocaleLowerCase()}`
  if (seenCities.has(key)) return false
  seenCities.add(key)
  return true
})

const location = (name: string, id: string): Location => ({
  ...CITY_DATABASE.find((city) => city.name === name)!,
  id,
})

export const DEFAULT_TRIP: Trip = {
  name: '环游世界 2026',
  locations: [
    location('北京', 'beijing'),
    location('巴黎', 'paris'),
    location('纽约', 'new-york'),
    location('东京', 'tokyo'),
  ],
  legs: [
    { id: 'beijing→paris', fromId: 'beijing', toId: 'paris', transport: 'plane' },
    { id: 'paris→new-york', fromId: 'paris', toId: 'new-york', transport: 'plane' },
    { id: 'new-york→tokyo', fromId: 'new-york', toId: 'tokyo', transport: 'plane' },
  ],
  speed: 'standard',
  theme: 'midnight',
  language: 'zh',
}

export function createLocation(city: City): Location {
  return { ...city, id: `${city.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
}
