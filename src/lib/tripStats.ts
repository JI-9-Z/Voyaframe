import { geoDistance } from 'd3-geo'
import type { Trip } from '../types'

const EARTH_RADIUS_KM = 6371

export interface TripStats {
  distanceKm: number
  countries: number
  cities: number
  legs: number
}

export function calculateTripStats(trip: Trip): TripStats {
  const distanceKm = trip.locations.slice(0, -1).reduce((total, location, index) => {
    const next = trip.locations[index + 1]
    return total + geoDistance([location.longitude, location.latitude], [next.longitude, next.latitude]) * EARTH_RADIUS_KM
  }, 0)
  return {
    distanceKm: Math.round(distanceKm),
    countries: new Set(trip.locations.map((location) => location.country)).size,
    cities: trip.locations.length,
    legs: trip.legs.length,
  }
}
