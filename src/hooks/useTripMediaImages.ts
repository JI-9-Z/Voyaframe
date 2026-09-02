import { useEffect, useMemo, useState } from 'react'
import { loadMediaAsset } from '../services/mediaStorageService'
import type { Location } from '../types'

export function useTripMediaImages(locations: Location[]): Map<string, HTMLImageElement> {
  const assetIds = useMemo(() => locations.map((location) => location.photoAssetId).filter((id): id is string => Boolean(id)), [locations])
  const assetKey = assetIds.join('|')
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    let cancelled = false
    const urls: string[] = []
    void Promise.all(assetIds.map(async (id) => {
      const asset = await loadMediaAsset(id)
      if (!asset) return null
      const url = URL.createObjectURL(asset.blob)
      urls.push(url)
      const image = new Image()
      image.decoding = 'async'
      await new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); image.src = url })
      return image.naturalWidth ? [id, image] as const : null
    })).then((entries) => {
      if (!cancelled) setImages(new Map(entries.filter((entry): entry is readonly [string, HTMLImageElement] => Boolean(entry))))
    }).catch(() => { if (!cancelled) setImages(new Map()) })
    return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [assetKey])

  return images
}
