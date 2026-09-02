import type { Trip } from '../types'
import { normalizeTrip } from './localStorageService'
import { blobToDataUrl, dataUrlToBlob, loadMediaAsset, putMediaAsset, type MediaAssetRecord } from './mediaStorageService'

const safeFilename = (name: string) => name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'voyaframe-trip'

interface PortableAsset { id: string; name: string; type: string; kind: 'photo' | 'music'; data: string; createdAt: number }

function mediaIds(trip: Trip): string[] {
  return [...new Set([trip.story.musicAssetId, ...trip.locations.map((location) => location.photoAssetId)].filter((id): id is string => Boolean(id)))]
}

export async function downloadTripJson(trip: Trip): Promise<void> {
  const assets = (await Promise.all(mediaIds(trip).map(async (id): Promise<PortableAsset | null> => {
    const asset = await loadMediaAsset(id)
    if (!asset) return null
    return { id: asset.id, name: asset.name, type: asset.type, kind: asset.kind, data: await blobToDataUrl(asset.blob), createdAt: asset.createdAt }
  }))).filter((asset): asset is PortableAsset => Boolean(asset))
  const blob = new Blob([JSON.stringify({ format: 'voyaframe-trip', version: 2, trip, assets }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeFilename(trip.name)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readTripJson(file: File): Promise<Trip> {
  const parsed = JSON.parse(await file.text()) as { trip?: unknown; assets?: PortableAsset[] } | unknown
  const trip = normalizeTrip(typeof parsed === 'object' && parsed && 'trip' in parsed ? (parsed as { trip: unknown }).trip : parsed)
  if (!trip) throw new Error('INVALID_TRIP_FILE')
  if (typeof parsed === 'object' && parsed && 'assets' in parsed && Array.isArray((parsed as { assets?: unknown }).assets)) {
    await Promise.all(((parsed as { assets: PortableAsset[] }).assets).map(async (asset) => {
      if (!asset?.id || !asset.data || !['photo', 'music'].includes(asset.kind)) return
      const record: MediaAssetRecord = { id: asset.id, name: asset.name, type: asset.type, kind: asset.kind, blob: await dataUrlToBlob(asset.data), createdAt: asset.createdAt || Date.now() }
      await putMediaAsset(record)
    }))
  }
  return trip
}
