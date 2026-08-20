import type { Location, Transport, TripLeg } from '../types'

export function legId(fromId: string, toId: string): string {
  return `${fromId}→${toId}`
}

export function rebuildLegs(locations: Location[], existing: TripLeg[] = [], fallback: Transport = 'plane'): TripLeg[] {
  return locations.slice(0, -1).map((location, index) => {
    const to = locations[index + 1]
    const matched = existing.find((leg) => leg.fromId === location.id && leg.toId === to.id)
    return matched ?? { id: legId(location.id, to.id), fromId: location.id, toId: to.id, transport: fallback, routeStyle: 'glow', labelTiming: 'always' }
  })
}
