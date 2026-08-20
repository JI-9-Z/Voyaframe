import { CITY_DATABASE, createLocation } from './cityDatabase'
import { rebuildLegs } from '../lib/tripModel'
import type { Language, Transport, Trip } from '../types'

export interface TripTemplate { id: string; nameZh: string; nameEn: string; cities: string[]; transports: Transport[] }

export const TRIP_TEMPLATES: TripTemplate[] = [
  { id: 'china-classic', nameZh: '华夏古今', nameEn: 'China Highlights', cities: ['北京', '西安', '成都', '上海'], transports: ['train', 'train', 'plane'] },
  { id: 'europe-rail', nameZh: '欧洲铁路漫游', nameEn: 'Grand Europe by Rail', cities: ['伦敦', '巴黎', '阿姆斯特丹', '柏林', '罗马'], transports: ['train', 'train', 'train', 'train'] },
  { id: 'pacific-loop', nameZh: '环太平洋之旅', nameEn: 'Pacific Loop', cities: ['上海', '东京', '悉尼', '洛杉矶', '温哥华'], transports: ['plane', 'plane', 'plane', 'train'] },
]

export function tripFromTemplate(template: TripTemplate, current: Trip, language: Language): Trip {
  const locations = template.cities.map((name) => createLocation(CITY_DATABASE.find((city) => city.name === name)!))
  const legs = rebuildLegs(locations).map((leg, index) => ({ ...leg, transport: template.transports[index] ?? 'plane' as Transport }))
  return { ...current, name: language === 'zh' ? template.nameZh : template.nameEn, locations, legs }
}
