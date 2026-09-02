import { DEFAULT_TRIP } from '../data/cityDatabase'
import type { Trip } from '../types'
import { rebuildLegs } from '../lib/tripModel'

// 保留旧键名，确保品牌升级后用户已经保存的行程不会丢失。
const STORAGE_KEY = 'travel-motion:trip:v1'

export function normalizeTrip(value: unknown): Trip | null {
  if (!value || typeof value !== 'object') return null
  const parsed = value as Trip & { transport?: 'plane' | 'car' | 'train' | 'ship' }
  if (!parsed.name || !Array.isArray(parsed.locations) || parsed.locations.length < 2) return null
  return {
    ...parsed,
    speed: ['fast', 'standard', 'slow'].includes(parsed.speed) ? parsed.speed : 'standard',
    theme: ['midnight', 'ocean', 'minimal'].includes(parsed.theme) ? parsed.theme : 'midnight',
    language: parsed.language === 'en' ? 'en' : 'zh',
    aspectRatio: ['16:9', '9:16', '1:1'].includes(parsed.aspectRatio) ? parsed.aspectRatio : '16:9',
    story: {
      subtitle: parsed.story?.subtitle ?? '',
      traveler: parsed.story?.traveler ?? '',
      introDuration: Math.max(0, Math.min(8, parsed.story?.introDuration ?? 2.5)),
      outroDuration: Math.max(0, Math.min(8, parsed.story?.outroDuration ?? 3)),
      showStats: parsed.story?.showStats ?? true,
      musicAssetId: parsed.story?.musicAssetId,
      musicName: parsed.story?.musicName,
      musicVolume: Math.max(0, Math.min(1, parsed.story?.musicVolume ?? .35)),
    },
    legs: rebuildLegs(parsed.locations, parsed.legs, parsed.transport ?? 'plane'),
  }
}

export function loadTrip(): Trip {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return DEFAULT_TRIP
    return normalizeTrip(JSON.parse(value)) ?? DEFAULT_TRIP
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
