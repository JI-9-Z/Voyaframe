import { geoDistance, type GeoProjection } from 'd3-geo'
import type { Point } from '../lib/coordinateProjection'
import type { RouteStyle } from '../types'

export type SphericalCoordinate = [number, number]

function visible(coordinate: SphericalCoordinate, viewCenter: SphericalCoordinate): boolean {
  return geoDistance(coordinate, viewCenter) <= Math.PI / 2 + .015
}

function traceVisibleRoute(
  context: CanvasRenderingContext2D,
  projection: GeoProjection,
  viewCenter: SphericalCoordinate,
  coordinates: SphericalCoordinate[],
  progress: number,
): void {
  const last = Math.max(1, Math.min(coordinates.length - 1, Math.ceil((coordinates.length - 1) * progress)))
  context.beginPath()
  let drawing = false
  for (let index = 0; index <= last; index += 1) {
    const coordinate = coordinates[index]
    const projected = projection(coordinate)
    if (!projected || !visible(coordinate, viewCenter)) { drawing = false; continue }
    if (!drawing) { context.moveTo(projected[0], projected[1]); drawing = true }
    else context.lineTo(projected[0], projected[1])
  }
}

export function drawFutureRoute(context: CanvasRenderingContext2D, projection: GeoProjection, center: SphericalCoordinate, coordinates: SphericalCoordinate[]): void {
  context.save(); context.setLineDash([7, 9]); context.lineWidth = 1.8; context.strokeStyle = 'rgba(174, 192, 214, .25)'; traceVisibleRoute(context, projection, center, coordinates, 1); context.stroke(); context.restore()
}

function applyRouteStyle(context: CanvasRenderingContext2D, style: RouteStyle, active: boolean): void {
  if (style === 'dashed') context.setLineDash(active ? [11, 8] : [8, 7])
  context.lineWidth = style === 'clean' ? (active ? 3.2 : 2.2) : (active ? 5 : 2.8)
  context.shadowBlur = style === 'glow' && active ? 12 : 0
}

export function drawCompletedRoute(context: CanvasRenderingContext2D, projection: GeoProjection, center: SphericalCoordinate, coordinates: SphericalCoordinate[], style: RouteStyle = 'glow'): void {
  context.save(); applyRouteStyle(context, style, false); context.strokeStyle = 'rgba(155, 215, 225, .72)'; traceVisibleRoute(context, projection, center, coordinates, 1); context.stroke(); context.restore()
}

export function drawActiveRoute(context: CanvasRenderingContext2D, projection: GeoProjection, center: SphericalCoordinate, coordinates: SphericalCoordinate[], progress: number, style: RouteStyle = 'glow'): void {
  context.save(); context.lineCap = 'round'; context.lineJoin = 'round'; applyRouteStyle(context, style, true); context.shadowColor = 'rgba(155,215,225,.62)'
  const start = projection(coordinates[0]) ?? [0, 0]; const end = projection(coordinates[coordinates.length - 1]) ?? [1280, 720]
  const gradient = context.createLinearGradient(start[0], start[1], end[0], end[1]); gradient.addColorStop(0, '#9bd7e1'); gradient.addColorStop(.72, '#b5dde1'); gradient.addColorStop(1, '#d8b477'); context.strokeStyle = gradient
  traceVisibleRoute(context, projection, center, coordinates, progress); context.stroke(); context.restore()
}

export function projectVisiblePoint(projection: GeoProjection, center: SphericalCoordinate, coordinate: SphericalCoordinate): Point | null {
  const value = projection(coordinate)
  if (!value || !visible(coordinate, center)) return null
  return { x: value[0], y: value[1] }
}
