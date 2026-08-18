import { geoDistance, type GeoProjection } from 'd3-geo'
import type { Point } from '../lib/coordinateProjection'

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

export function drawCompletedRoute(context: CanvasRenderingContext2D, projection: GeoProjection, center: SphericalCoordinate, coordinates: SphericalCoordinate[]): void {
  context.save(); context.lineWidth = 2.8; context.strokeStyle = 'rgba(94, 234, 212, .7)'; traceVisibleRoute(context, projection, center, coordinates, 1); context.stroke(); context.restore()
}

export function drawActiveRoute(context: CanvasRenderingContext2D, projection: GeoProjection, center: SphericalCoordinate, coordinates: SphericalCoordinate[], progress: number): void {
  context.save(); context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 5; context.shadowBlur = 18; context.shadowColor = '#60a5fa'
  const start = projection(coordinates[0]) ?? [0, 0]; const end = projection(coordinates[coordinates.length - 1]) ?? [1280, 720]
  const gradient = context.createLinearGradient(start[0], start[1], end[0], end[1]); gradient.addColorStop(0, '#22d3ee'); gradient.addColorStop(.52, '#818cf8'); gradient.addColorStop(1, '#c084fc'); context.strokeStyle = gradient
  traceVisibleRoute(context, projection, center, coordinates, progress); context.stroke(); context.restore()
}

export function projectVisiblePoint(projection: GeoProjection, center: SphericalCoordinate, coordinate: SphericalCoordinate): Point | null {
  const value = projection(coordinate)
  if (!value || !visible(coordinate, center)) return null
  return { x: value[0], y: value[1] }
}
