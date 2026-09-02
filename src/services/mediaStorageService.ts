export type MediaKind = 'photo' | 'music'

export interface MediaAssetRecord {
  id: string
  name: string
  type: string
  kind: MediaKind
  blob: Blob
  createdAt: number
}

const DB_NAME = 'voyaframe-media'
const STORE_NAME = 'assets'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('MEDIA_DATABASE_UNAVAILABLE'))
  })
}

async function optimizePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  if (typeof createImageBitmap === 'undefined') return file
  const bitmap = await createImageBitmap(file)
  const maximum = 1800
  const scale = Math.min(1, maximum / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', .86))
}

export async function putMediaAsset(record: MediaAssetRecord): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('MEDIA_WRITE_FAILED'))
  })
  database.close()
}

export async function saveMediaFile(file: File, kind: MediaKind): Promise<MediaAssetRecord> {
  const blob = kind === 'photo' ? await optimizePhoto(file) : file
  const record: MediaAssetRecord = { id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: file.name, type: blob.type || file.type, kind, blob, createdAt: Date.now() }
  await putMediaAsset(record)
  return record
}

export async function loadMediaAsset(id: string): Promise<MediaAssetRecord | null> {
  const database = await openDatabase()
  const value = await new Promise<MediaAssetRecord | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve((request.result as MediaAssetRecord | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('MEDIA_READ_FAILED'))
  })
  database.close()
  return value
}

export async function deleteMediaAsset(id?: string): Promise<void> {
  if (!id) return
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('MEDIA_DELETE_FAILED'))
  })
  database.close()
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('MEDIA_ENCODE_FAILED'))
    reader.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob()
}
