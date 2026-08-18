import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject, type WheelEvent } from 'react'
import { geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import worldAtlas from 'world-atlas/countries-110m.json'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { formatTime } from '../lib/animationTimeline'
import { locationName, t } from '../lib/i18n'
import { interpolateCoordinate, routeCoordinatesForTransport, smoothstep, sphericalMean } from '../lib/globeGeometry'
import { drawActiveRoute, drawCompletedRoute, drawFutureRoute, projectVisiblePoint, type SphericalCoordinate } from '../renderers/RouteRenderer'
import { drawVehicle } from '../renderers/VehicleRenderer'
import type { AnimationStatus, MapTheme, TimelineState, Trip } from '../types'

interface Props { trip: Trip; timeline: TimelineState; status: AnimationStatus; canvasRef: RefObject<HTMLCanvasElement | null>; disabled?: boolean }
interface GlobeView { center: SphericalCoordinate; zoom: number }

const WIDTH = 1280
const HEIGHT = 720
const GLOBE_CENTER: [number, number] = [760, 352]
const BASE_RADIUS = 286
const atlas = worldAtlas as unknown as Topology<{ countries: GeometryCollection; land: GeometryCollection }>
const LAND = feature(atlas, atlas.objects.land)
const BORDERS = mesh(atlas, atlas.objects.countries, (a, b) => a !== b)
const GRATICULE = geoGraticule10()

const THEMES: Record<MapTheme, { background: string; glow: string; ocean: string; land: string; border: string; grid: string; text: string; atmosphere: string }> = {
  midnight: { background: '#050c14', glow: '#0b2944', ocean: '#071d31', land: '#15364b', border: '#3d7390', grid: 'rgba(116,174,207,.14)', text: '#e8f3fb', atmosphere: '#38bdf8' },
  ocean: { background: '#03131e', glow: '#07546d', ocean: '#07344a', land: '#197083', border: '#63d7df', grid: 'rgba(123,232,235,.16)', text: '#eaffff', atmosphere: '#22d3ee' },
  minimal: { background: '#dfe9ed', glow: '#c4dce5', ocean: '#d9edf3', land: '#b9c9cf', border: '#718b96', grid: 'rgba(57,79,89,.14)', text: '#15232b', atmosphere: '#6da6b9' },
}

function coordinateAtProgress(coordinates: SphericalCoordinate[], progress: number): SphericalCoordinate {
  if (!coordinates.length) return [0, 0]
  const position = Math.max(0, Math.min(1, progress)) * (coordinates.length - 1)
  const index = Math.floor(position)
  const next = Math.min(coordinates.length - 1, index + 1)
  return geoInterpolate(coordinates[index], coordinates[next])(position - index) as SphericalCoordinate
}

function legView(trip: Trip, index: number, routes: SphericalCoordinate[][]): GlobeView {
  const from = trip.locations[index]
  const to = trip.locations[index + 1]
  if (!from || !to) return { center: sphericalMean(trip.locations), zoom: .96 }
  const start: SphericalCoordinate = [from.longitude, from.latitude]
  const end: SphericalCoordinate = [to.longitude, to.latitude]
  const route = routes[index]
  const center = route?.length ? coordinateAtProgress(route, .5) : geoInterpolate(start, end)(.5) as SphericalCoordinate
  const distance = geoDistance(start, end)
  return { center, zoom: Math.max(1.28, Math.min(1.66, 1.69 - distance * .23)) }
}

function viewFor(trip: Trip, timeline: TimelineState, routes: SphericalCoordinate[][]): GlobeView {
  const full: GlobeView = { center: sphericalMean(trip.locations), zoom: .92 }
  if (timeline.phase === 'idle' || trip.locations.length < 2) return full
  const last = trip.locations[trip.locations.length - 1]
  const finalView: GlobeView = last ? { center: [last.longitude, last.latitude], zoom: 1.72 } : full
  if (timeline.phase === 'completed') return finalView
  const index = Math.min(timeline.segmentIndex, trip.locations.length - 2)
  const current = legView(trip, index, routes)
  if (index === 0 && timeline.phase === 'flight' && timeline.segmentProgress < .1) {
    const amount = smoothstep(timeline.segmentProgress / .1)
    return { center: interpolateCoordinate(full.center, current.center, amount), zoom: full.zoom + (current.zoom - full.zoom) * amount }
  }
  if (timeline.phase === 'hold') {
    const next = index < trip.locations.length - 2 ? legView(trip, index + 1, routes) : finalView
    const amount = smoothstep(Math.max(0, (timeline.holdProgress - .15) / .85))
    return { center: interpolateCoordinate(current.center, next.center, amount), zoom: current.zoom + (next.zoom - current.zoom) * amount }
  }
  return current
}

function drawBackground(context: CanvasRenderingContext2D, theme: MapTheme): void {
  const colors = THEMES[theme]
  const gradient = context.createRadialGradient(GLOBE_CENTER[0], GLOBE_CENTER[1], 40, GLOBE_CENTER[0], GLOBE_CENTER[1], 720)
  gradient.addColorStop(0, colors.glow); gradient.addColorStop(1, colors.background); context.fillStyle = gradient; context.fillRect(0, 0, WIDTH, HEIGHT)
  context.save(); context.globalAlpha = theme === 'minimal' ? .16 : .34; context.fillStyle = theme === 'minimal' ? '#607d8b' : '#fff'
  for (let index = 0; index < 90; index += 1) { const x = (index * 149) % WIDTH; const y = (index * 83) % HEIGHT; const radius = index % 7 === 0 ? 1.1 : .55; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill() }
  context.restore()
}

type TexturePoint = [number, number]
interface SatelliteCache { canvas: HTMLCanvasElement | null; source: HTMLCanvasElement | null; sourceImage: string; key: string }

function drawTexturedTriangle(context: CanvasRenderingContext2D, image: HTMLCanvasElement, source: [TexturePoint, TexturePoint, TexturePoint], destination: [TexturePoint, TexturePoint, TexturePoint]): void {
  const [[sx0, sy0], [sx1, sy1], [sx2, sy2]] = source
  const [[dx0, dy0], [dx1, dy1], [dx2, dy2]] = destination
  const denominator = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1)
  if (Math.abs(denominator) < .0001) return
  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denominator
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denominator
  const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / denominator
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denominator
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denominator
  const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / denominator
  context.save(); context.beginPath(); context.moveTo(dx0, dy0); context.lineTo(dx1, dy1); context.lineTo(dx2, dy2); context.closePath(); context.clip(); context.transform(a, b, c, d, e, f); context.drawImage(image, 0, 0); context.restore()
}

function drawSatelliteTexture(context: CanvasRenderingContext2D, projection: ReturnType<typeof geoOrthographic>, image: HTMLCanvasElement, viewCenter: SphericalCoordinate): void {
  const longitudeStep = 18
  const latitudeStep = 15
  for (let latitudeTop = 90; latitudeTop > -90; latitudeTop -= latitudeStep) {
    const latitudeBottom = Math.max(-90, latitudeTop - latitudeStep)
    for (let longitudeLeft = -180; longitudeLeft < 180; longitudeLeft += longitudeStep) {
      const longitudeRight = longitudeLeft + longitudeStep
      const coordinates: [SphericalCoordinate, SphericalCoordinate, SphericalCoordinate, SphericalCoordinate] = [
        [longitudeLeft, latitudeTop], [longitudeRight, latitudeTop], [longitudeRight, latitudeBottom], [longitudeLeft, latitudeBottom],
      ]
      const projected = coordinates.map((coordinate) => projection(coordinate) as TexturePoint) as [TexturePoint, TexturePoint, TexturePoint, TexturePoint]
      const source: [TexturePoint, TexturePoint, TexturePoint, TexturePoint] = [
        [((longitudeLeft + 180) / 360) * image.width, ((90 - latitudeTop) / 180) * image.height],
        [((longitudeRight + 180) / 360) * image.width, ((90 - latitudeTop) / 180) * image.height],
        [((longitudeRight + 180) / 360) * image.width, ((90 - latitudeBottom) / 180) * image.height],
        [((longitudeLeft + 180) / 360) * image.width, ((90 - latitudeBottom) / 180) * image.height],
      ]
      const centerA: SphericalCoordinate = [longitudeLeft + longitudeStep * .67, latitudeTop - latitudeStep * .33]
      const centerB: SphericalCoordinate = [longitudeLeft + longitudeStep * .33, latitudeTop - latitudeStep * .67]
      if (geoDistance(centerA, viewCenter) <= Math.PI / 2 + .12) drawTexturedTriangle(context, image, [source[0], source[1], source[2]], [projected[0], projected[1], projected[2]])
      if (geoDistance(centerB, viewCenter) <= Math.PI / 2 + .12) drawTexturedTriangle(context, image, [source[0], source[2], source[3]], [projected[0], projected[2], projected[3]])
    }
  }
}

function satelliteLayer(projection: ReturnType<typeof geoOrthographic>, image: HTMLImageElement, viewCenter: SphericalCoordinate, cache: SatelliteCache): HTMLCanvasElement {
  const key = `${image.src}|${(Math.round(viewCenter[0] / .75) * .75).toFixed(2)}|${(Math.round(viewCenter[1] / .75) * .75).toFixed(2)}|${Math.round(projection.scale() / 2) * 2}`
  if (!cache.canvas) { cache.canvas = document.createElement('canvas'); cache.canvas.width = WIDTH; cache.canvas.height = HEIGHT }
  if (!cache.source || cache.sourceImage !== image.src) {
    cache.source = document.createElement('canvas'); cache.source.width = 1440; cache.source.height = 720
    cache.source.getContext('2d')?.drawImage(image, 0, 0, cache.source.width, cache.source.height)
    cache.sourceImage = image.src
  }
  if (cache.key !== key) {
    const layerContext = cache.canvas.getContext('2d')
    if (layerContext) {
      layerContext.clearRect(0, 0, WIDTH, HEIGHT)
      const path = geoPath(projection, layerContext)
      layerContext.save(); layerContext.beginPath(); path({ type: 'Sphere' }); layerContext.clip()
      drawSatelliteTexture(layerContext, projection, cache.source, viewCenter)
      layerContext.restore()
      cache.key = key
    }
  }
  return cache.canvas
}

function drawGlobe(context: CanvasRenderingContext2D, projection: ReturnType<typeof geoOrthographic>, theme: MapTheme, satelliteImage: HTMLImageElement | null, viewCenter: SphericalCoordinate, satelliteCache: SatelliteCache): void {
  const colors = THEMES[theme]; const path = geoPath(projection, context)
  context.save(); context.shadowBlur = 35; context.shadowColor = colors.atmosphere; context.beginPath(); path({ type: 'Sphere' }); context.fillStyle = colors.ocean; context.fill(); context.restore()
  context.save(); context.beginPath(); path({ type: 'Sphere' }); context.clip()
  if (satelliteImage) context.drawImage(satelliteLayer(projection, satelliteImage, viewCenter, satelliteCache), 0, 0)
  else { context.beginPath(); path(LAND); context.fillStyle = colors.land; context.fill() }
  const oceanLight = context.createRadialGradient(GLOBE_CENTER[0] - 90, GLOBE_CENTER[1] - 110, 20, GLOBE_CENTER[0], GLOBE_CENTER[1], projection.scale())
  oceanLight.addColorStop(0, theme === 'minimal' ? 'rgba(255,255,255,.3)' : 'rgba(110,195,235,.12)'); oceanLight.addColorStop(1, theme === 'minimal' ? 'rgba(20,35,45,.08)' : 'rgba(0,4,10,.32)'); context.fillStyle = oceanLight; context.fillRect(GLOBE_CENTER[0] - projection.scale(), GLOBE_CENTER[1] - projection.scale(), projection.scale() * 2, projection.scale() * 2)
  context.beginPath(); path(GRATICULE); context.strokeStyle = colors.grid; context.lineWidth = .8; context.stroke()
  context.beginPath(); path(BORDERS); context.strokeStyle = satelliteImage ? 'rgba(220,241,252,.44)' : colors.border; context.globalAlpha = .8; context.lineWidth = .65; context.stroke(); context.restore()
  context.beginPath(); path({ type: 'Sphere' }); context.strokeStyle = theme === 'minimal' ? 'rgba(55,88,102,.36)' : 'rgba(125,211,252,.42)'; context.lineWidth = 1.5; context.stroke()
}

function drawMarker(context: CanvasRenderingContext2D, x: number, y: number, label: string, active: boolean, pulse: number, theme: MapTheme): void {
  const colors = THEMES[theme]; context.save()
  if (pulse > 0) { context.beginPath(); context.arc(x, y, 11 + pulse * 27, 0, Math.PI * 2); context.strokeStyle = `rgba(96,165,250,${.58 * (1 - pulse)})`; context.lineWidth = 3; context.stroke() }
  context.shadowBlur = active ? 22 : 11; context.shadowColor = active ? '#a78bfa' : '#22d3ee'; context.beginPath(); context.arc(x, y, active ? 7 : 5, 0, Math.PI * 2); context.fillStyle = active ? '#c4b5fd' : '#67e8f9'; context.fill()
  context.shadowBlur = 0; context.font = '600 16px Inter, system-ui, sans-serif'; context.textAlign = 'center'; context.fillStyle = colors.text; context.fillText(label, x, y - 16); context.restore()
}

function drawHud(context: CanvasRenderingContext2D, trip: Trip, timeline: TimelineState): void {
  const colors = THEMES[trip.theme]; const index = Math.min(timeline.segmentIndex, Math.max(0, trip.locations.length - 2)); const from = trip.locations[index]; const to = trip.locations[index + 1]; const transport = trip.legs[index]?.transport ?? 'plane'
  context.save(); context.fillStyle = trip.theme === 'minimal' ? 'rgba(255,255,255,.84)' : 'rgba(5,14,24,.78)'; context.strokeStyle = trip.theme === 'minimal' ? 'rgba(50,70,80,.15)' : 'rgba(255,255,255,.13)'; context.lineWidth = 1; context.beginPath(); context.roundRect(40, 40, 350, 132, 20); context.fill(); context.stroke()
    context.fillStyle = trip.theme === 'minimal' ? '#52636c' : '#8da8b9'; context.font = '600 12px Inter, system-ui'; context.fillText('VOYAFRAME  ·  3D GLOBE', 64, 70)
  context.fillStyle = colors.text; context.font = '700 24px Inter, system-ui'; context.fillText(from && to ? `${locationName(from, trip.language)}  →  ${locationName(to, trip.language)}` : trip.name, 64, 108)
  context.fillStyle = trip.theme === 'minimal' ? '#607580' : '#9bb4c4'; context.font = '500 13px Inter, system-ui'; context.fillText(`${t(trip.language, transport)}  ·  ${t(trip.language, 'leg')} ${trip.locations.length > 1 ? index + 1 : 0}/${Math.max(0, trip.locations.length - 1)}`, 64, 139)
  const barX = 48, barY = 671, barW = 1184; context.fillStyle = trip.theme === 'minimal' ? 'rgba(40,60,70,.14)' : 'rgba(255,255,255,.14)'; context.beginPath(); context.roundRect(barX, barY, barW, 5, 3); context.fill()
  const gradient = context.createLinearGradient(barX, 0, barX + barW, 0); gradient.addColorStop(0, '#22d3ee'); gradient.addColorStop(1, '#a78bfa'); context.fillStyle = gradient; context.beginPath(); context.roundRect(barX, barY, barW * timeline.progress, 5, 3); context.fill()
  context.fillStyle = colors.text; context.font = '600 14px Inter, system-ui'; context.fillText(formatTime(timeline.time), barX, 705); context.textAlign = 'right'; context.fillText(formatTime(timeline.totalDuration), barX + barW, 705); context.restore()
  context.save(); context.textAlign = 'right'; context.font = '500 10px Inter, system-ui'; context.fillStyle = trip.theme === 'minimal' ? 'rgba(25,45,55,.52)' : 'rgba(220,240,250,.48)'; context.fillText('SATELLITE IMAGERY · NASA EARTH OBSERVATORY', 1228, 650); context.restore()
}

export function MapCanvas({ trip, timeline, status, canvasRef, disabled }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; longitude: number; latitude: number } | null>(null)
  const satelliteCacheRef = useRef<SatelliteCache>({ canvas: null, source: null, sourceImage: '', key: '' })
  const [manualRotation, setManualRotation] = useState<SphericalCoordinate>([0, 0])
  const [zoom, setZoom] = useState(1)
  const [satelliteImage, setSatelliteImage] = useState<HTMLImageElement | null>(null)
  const previousStatusRef = useRef<AnimationStatus>(status)
  const previousTimeRef = useRef(timeline.time)
  const cameraLocked = status === 'playing' || status === 'recording'
  useEffect(() => {
    const wasAutomatic = previousStatusRef.current === 'playing' || previousStatusRef.current === 'recording'
    const restarted = timeline.time + .05 < previousTimeRef.current
    if ((cameraLocked && !wasAutomatic) || restarted) {
      setManualRotation([0, 0]); setZoom(1); dragRef.current = null
    }
    previousStatusRef.current = status
    previousTimeRef.current = timeline.time
  }, [cameraLocked, status, timeline.time])
  useEffect(() => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => setSatelliteImage(image)
    image.src = `${import.meta.env.BASE_URL}earth-blue-marble.jpg`
    return () => { image.onload = null }
  }, [])
  const routeCoordinates = useMemo(() => trip.locations.slice(0, -1).map((location, index) => routeCoordinatesForTransport(location, trip.locations[index + 1], trip.legs[index]?.transport ?? 'plane')), [trip.legs, trip.locations])

  const draw = useCallback((context: CanvasRenderingContext2D, now: number) => {
    const automatic = viewFor(trip, timeline, routeCoordinates)
    const rotation = cameraLocked ? [0, 0] as SphericalCoordinate : manualRotation
    const viewCenter: SphericalCoordinate = [automatic.center[0] + rotation[0], Math.max(-82, Math.min(82, automatic.center[1] + rotation[1]))]
    const projection = geoOrthographic().translate(GLOBE_CENTER).scale(BASE_RADIUS * automatic.zoom * (cameraLocked ? 1 : zoom)).rotate([-viewCenter[0], -viewCenter[1], 0]).clipAngle(90).precision(.35)
    context.clearRect(0, 0, WIDTH, HEIGHT); drawBackground(context, trip.theme); drawGlobe(context, projection, trip.theme, satelliteImage, viewCenter, satelliteCacheRef.current)
    routeCoordinates.forEach((coordinates, index) => {
      if (timeline.phase === 'completed' || index < timeline.segmentIndex) drawCompletedRoute(context, projection, viewCenter, coordinates)
      else if (index === timeline.segmentIndex && timeline.phase !== 'idle') drawActiveRoute(context, projection, viewCenter, coordinates, timeline.segmentProgress)
      else drawFutureRoute(context, projection, viewCenter, coordinates)
    })
    trip.locations.forEach((location, index) => {
      const reached = timeline.phase === 'idle' || timeline.phase === 'completed' || index <= timeline.segmentIndex + 1; if (!reached) return
      const point = projectVisiblePoint(projection, viewCenter, [location.longitude, location.latitude]); if (!point) return
      const destination = index === timeline.segmentIndex + 1 && timeline.phase !== 'idle'; const arrival = destination && timeline.segmentProgress > .88 ? (now / 900) % 1 : 0
      drawMarker(context, point.x, point.y, locationName(location, trip.language), destination, arrival, trip.theme)
    })
    if ((timeline.phase === 'flight' || timeline.phase === 'hold') && routeCoordinates[timeline.segmentIndex]) {
      const coordinates = routeCoordinates[timeline.segmentIndex]; const currentIndex = Math.min(coordinates.length - 1, Math.round(timeline.segmentProgress * (coordinates.length - 1))); const nextIndex = Math.min(coordinates.length - 1, currentIndex + 1)
      const point = projectVisiblePoint(projection, viewCenter, coordinates[currentIndex]); const next = projectVisiblePoint(projection, viewCenter, coordinates[nextIndex])
      if (point) drawVehicle(context, point, next ? Math.atan2(next.y - point.y, next.x - point.x) : 0, trip.legs[timeline.segmentIndex]?.transport ?? 'plane')
    }
    drawHud(context, trip, timeline)
  }, [cameraLocked, manualRotation, routeCoordinates, satelliteImage, timeline, trip, zoom])
  useCanvasRenderer(canvasRef, draw)

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => { if (disabled || cameraLocked) return; event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, longitude: manualRotation[0], latitude: manualRotation[1] } }
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (!drag) return; setManualRotation([drag.longitude - (event.clientX - drag.x) * .28, Math.max(-70, Math.min(70, drag.latitude + (event.clientY - drag.y) * .22))]) }
  const onPointerUp = () => { dragRef.current = null }
  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => { if (disabled || cameraLocked) return; setZoom((value) => Math.max(.7, Math.min(1.65, value * Math.exp(-event.deltaY * .001)))) }
  const changeZoom = (factor: number) => setZoom((value) => Math.max(.7, Math.min(1.65, value * factor)))
  const toggleFullscreen = () => { if (!document.fullscreenElement) void wrapperRef.current?.requestFullscreen(); else void document.exitFullscreen() }

  return <div ref={wrapperRef} className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-[#071018]">
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} className="block h-full max-h-full w-full touch-none object-contain active:cursor-grabbing" aria-label={t(trip.language, 'canvasLabel')} />
    <div className="absolute right-4 top-4 flex items-center gap-2">
      <div className="flex overflow-hidden rounded-xl border border-white/15 bg-black/35 backdrop-blur"><button type="button" onClick={() => changeZoom(1.12)} disabled={disabled || cameraLocked} className="px-3 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-40" aria-label={t(trip.language, 'zoomIn')}>＋</button><button type="button" onClick={() => changeZoom(.89)} disabled={disabled || cameraLocked} className="border-l border-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-40" aria-label={t(trip.language, 'zoomOut')}>−</button><button type="button" onClick={() => { setZoom(1); setManualRotation([0, 0]) }} disabled={disabled || cameraLocked} className="border-l border-white/10 px-3 py-2 text-[10px] font-semibold hover:bg-white/10 disabled:opacity-40">{t(trip.language, 'reset')}</button></div>
      <button type="button" onClick={toggleFullscreen} disabled={disabled} className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/55 disabled:opacity-40">⛶ {t(trip.language, 'fullscreen')}</button>
    </div>
    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[9px] text-white/50 backdrop-blur">{t(trip.language, 'gesture')}</div>
  </div>
}
