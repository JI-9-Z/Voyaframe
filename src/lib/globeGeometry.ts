import { geoInterpolate } from 'd3-geo'
import type { Location, Transport } from '../types'
import type { SphericalCoordinate } from '../renderers/RouteRenderer'

const radians = Math.PI / 180
const degrees = 180 / Math.PI

export function sphericalMean(locations: Location[]): SphericalCoordinate {
  if (!locations.length) return [15, 15]
  let x = 0, y = 0, z = 0
  locations.forEach((location) => {
    const longitude = location.longitude * radians; const latitude = location.latitude * radians; const cosLatitude = Math.cos(latitude)
    x += cosLatitude * Math.cos(longitude); y += cosLatitude * Math.sin(longitude); z += Math.sin(latitude)
  })
  if (Math.hypot(x, y, z) < .001) return [locations[0].longitude, locations[0].latitude]
  return [Math.atan2(y, x) * degrees, Math.atan2(z, Math.hypot(x, y)) * degrees]
}

export function greatCircleCoordinates(from: Location, to: Location, steps = 96): SphericalCoordinate[] {
  const interpolate = geoInterpolate([from.longitude, from.latitude], [to.longitude, to.latitude])
  return Array.from({ length: steps + 1 }, (_, index) => interpolate(index / steps) as SphericalCoordinate)
}

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function windingCoordinates(from: Location, to: Location, transport: Exclude<Transport, 'plane'>): SphericalCoordinate[] {
  const start: SphericalCoordinate = [from.longitude, from.latitude]
  const end: SphericalCoordinate = [to.longitude, to.latitude]
  const interpolate = geoInterpolate(start, end)
  const seed = hashSeed(`${from.name}|${to.name}|${transport}`)
  const settings = {
    car: { anchors: 34, amplitude: 2.7, waves: 5.5 },
    train: { anchors: 26, amplitude: 1.45, waves: 3.2 },
    ship: { anchors: 30, amplitude: .9, waves: 2.2 },
  }[transport]
  const distanceDegrees = Math.acos(Math.max(-1, Math.min(1,
    Math.sin(from.latitude * radians) * Math.sin(to.latitude * radians)
    + Math.cos(from.latitude * radians) * Math.cos(to.latitude * radians) * Math.cos((to.longitude - from.longitude) * radians),
  ))) * degrees
  const amplitude = Math.min(settings.amplitude, Math.max(.12, distanceDegrees * .065))
  const anchors = Array.from({ length: settings.anchors + 1 }, (_, index) => {
    const t = index / settings.anchors
    if (index === 0) return start
    if (index === settings.anchors) return end
    const base = interpolate(t) as SphericalCoordinate
    const envelope = Math.sin(Math.PI * t)
    const primary = Math.sin((t * settings.waves + seed) * Math.PI * 2)
    const secondary = Math.sin((t * (settings.waves * 2.3) + seed * 3.7) * Math.PI * 2) * .34
    const offset = amplitude * envelope * (primary + secondary)
    const latitude = Math.max(-82, Math.min(82, base[1] + offset))
    const longitudeScale = Math.max(.32, Math.cos(latitude * radians))
    const longitude = base[0] + (offset * .72 * Math.cos((t * 3.1 + seed) * Math.PI * 2)) / longitudeScale
    return [longitude, latitude] as SphericalCoordinate
  })
  const result: SphericalCoordinate[] = []
  anchors.slice(0, -1).forEach((anchor, index) => {
    const segment = geoInterpolate(anchor, anchors[index + 1])
    const subdivisions = transport === 'car' ? 3 : 4
    for (let step = 0; step < subdivisions; step += 1) result.push(segment(step / subdivisions) as SphericalCoordinate)
  })
  result.push(end)
  return result
}

export function routeCoordinatesForTransport(from: Location, to: Location, transport: Transport): SphericalCoordinate[] {
  return transport === 'plane' ? greatCircleCoordinates(from, to) : windingCoordinates(from, to, transport)
}

export function interpolateCoordinate(from: SphericalCoordinate, to: SphericalCoordinate, progress: number): SphericalCoordinate {
  return geoInterpolate(from, to)(Math.max(0, Math.min(1, progress))) as SphericalCoordinate
}

export function smoothstep(value: number): number {
  const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t)
}
