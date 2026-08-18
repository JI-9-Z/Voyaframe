import { DEFAULT_TRIP } from '../data/cityDatabase'
import type { Trip } from '../types'
import { rebuildLegs } from '../lib/tripModel'

// 保留旧键名，确保品牌升级后用户已经保存的行程不会丢失。
const STORAGE_KEY = 'travel-motion:trip:v1'

export function loadTrip(): Trip {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return DEFAULT_TRIP
    const parsed = JSON.parse(value) as Trip & { transport?: 'plane' | 'car' | 'train' | 'ship' }
    if (!parsed.name || !Array.isArray(parsed.locations)) return DEFAULT_TRIP
    return { ...parsed, language: parsed.language === 'en' ? 'en' : 'zh', legs: rebuildLegs(parsed.locations, parsed.legs, parsed.transport ?? 'plane') }
  } catch {
    return DEFAULT_TRIP
  }
}

export function saveTrip(trip: Trip): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip))
  } catch {
    // The demo remains usable when storage is blocked (for example, private mode).
  }
}
