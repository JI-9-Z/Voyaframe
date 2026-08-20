import type { Trip } from '../types'
import { normalizeTrip } from './localStorageService'

const safeFilename = (name: string) => name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_') || 'voyaframe-trip'

export function downloadTripJson(trip: Trip): void {
  const blob = new Blob([JSON.stringify({ format: 'voyaframe-trip', version: 1, trip }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeFilename(trip.name)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readTripJson(file: File): Promise<Trip> {
  const parsed = JSON.parse(await file.text()) as { trip?: unknown } | unknown
  const trip = normalizeTrip(typeof parsed === 'object' && parsed && 'trip' in parsed ? (parsed as { trip: unknown }).trip : parsed)
  if (!trip) throw new Error('INVALID_TRIP_FILE')
  return trip
}
