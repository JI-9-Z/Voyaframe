import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject, type WheelEvent } from 'react'
import { geoGraticule10, geoInterpolate, geoOrthographic, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import worldAtlas from 'world-atlas/countries-110m.json'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Icon } from './Icon'
import { formatTime } from '../lib/animationTimeline'
import { locationName, t } from '../lib/i18n'
import { interpolateCoordinate, routeCoordinatesForTransport, smoothstep, sphericalMean } from '../lib/globeGeometry'
import { drawActiveRoute, drawCompletedRoute, drawFutureRoute, projectVisiblePoint, type SphericalCoordinate } from '../renderers/RouteRenderer'
import { drawVehicle } from '../renderers/VehicleRenderer'
import type { AnimationStatus, MapTheme, TimelineState, Trip } from '../types'
import { useTripMediaImages } from '../hooks/useTripMediaImages'
import { calculateTripStats } from '../lib/tripStats'

interface Props { trip: Trip; timeline: TimelineState; status: AnimationStatus; canvasRef: RefObject<HTMLCanvasElement | null>; disabled?: boolean }
interface GlobeView { center: SphericalCoordinate; zoom: number }
interface FrameLayout { width: number; height: number; globeCenter: [number, number]; baseRadius: number }

const FRAME_LAYOUTS: Record<Trip['aspectRatio'], FrameLayout> = {
  '16:9': { width: 1280, height: 720, globeCenter: [760, 352], baseRadius: 286 },
  '1:1': { width: 1080, height: 1080, globeCenter: [540, 560], baseRadius: 390 },
  '9:16': { width: 720, height: 1280, globeCenter: [360, 680], baseRadius: 300 },
}
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

function trackingLegView(trip: Trip, index: number, routes: SphericalCoordinate[][], progress: number): GlobeView {
  const from = trip.locations[index]
  const to = trip.locations[index + 1]
  if (!from || !to) return { center: sphericalMean(trip.locations), zoom: .96 }
  const route = routes[index]
  const easedLookAhead = Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) * .045
  const cameraProgress = Math.max(0, Math.min(1, progress + easedLookAhead))
  const center = route?.length
    ? coordinateAtProgress(route, cameraProgress)
    : geoInterpolate([from.longitude, from.latitude], [to.longitude, to.latitude])(cameraProgress) as SphericalCoordinate
  return { center, zoom: trip.legs[index]?.cameraZoom ?? 1.78 }
}

function viewFor(trip: Trip, timeline: TimelineState, routes: SphericalCoordinate[][]): GlobeView {
  const full: GlobeView = { center: sphericalMean(trip.locations), zoom: .92 }
  if (timeline.phase === 'idle' || timeline.phase === 'intro' || trip.locations.length < 2) return full
  const last = trip.locations[trip.locations.length - 1]
  const finalView: GlobeView = last ? { center: [last.longitude, last.latitude], zoom: 1.9 } : full
  if (timeline.phase === 'completed' || timeline.phase === 'outro') return finalView
  const index = Math.min(timeline.segmentIndex, trip.locations.length - 2)
  const current = trackingLegView(trip, index, routes, timeline.segmentProgress)
  if (index === 0 && timeline.phase === 'flight' && timeline.segmentProgress < .14) {
    const amount = smoothstep(timeline.segmentProgress / .14)
    return { center: interpolateCoordinate(full.center, current.center, amount), zoom: full.zoom + (current.zoom - full.zoom) * amount }
  }
  if (timeline.phase === 'hold') {
    const next = index < trip.locations.length - 2 ? trackingLegView(trip, index + 1, routes, 0) : finalView
    const amount = smoothstep(Math.max(0, Math.min(1, (timeline.holdProgress - .18) / .64)))
    return { center: interpolateCoordinate(current.center, next.center, amount), zoom: current.zoom + (next.zoom - current.zoom) * amount }
  }
  return current
}

function drawBackground(context: CanvasRenderingContext2D, theme: MapTheme, layout: FrameLayout): void {
  const colors = THEMES[theme]
  const gradient = context.createRadialGradient(layout.globeCenter[0], layout.globeCenter[1], 40, layout.globeCenter[0], layout.globeCenter[1], Math.max(layout.width, layout.height) * .75)
  gradient.addColorStop(0, colors.glow); gradient.addColorStop(1, colors.background); context.fillStyle = gradient; context.fillRect(0, 0, layout.width, layout.height)
  context.save(); context.globalAlpha = theme === 'minimal' ? .16 : .34; context.fillStyle = theme === 'minimal' ? '#607d8b' : '#fff'
  for (let index = 0; index < 90; index += 1) { const x = (index * 149) % layout.width; const y = (index * 83) % layout.height; const radius = index % 7 === 0 ? 1.1 : .55; context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill() }
  context.restore()
}

interface SatelliteCache {
  canvas: HTMLCanvasElement | null
  gl: WebGLRenderingContext | null
  program: WebGLProgram | null
  positionBuffer: WebGLBuffer | null
  uvBuffer: WebGLBuffer | null
  indexBuffer: WebGLBuffer | null
  texture: WebGLTexture | null
  indexCount: number
  sourceImage: string
}

const SATELLITE_VERTEX_SHADER = `
  attribute vec3 a_position;
  attribute vec2 a_uv;
  uniform vec2 u_size;
  uniform vec2 u_origin;
  uniform float u_scale;
  uniform float u_longitude;
  uniform float u_latitude;
  varying vec2 v_uv;
  void main() {
    float cosLon = cos(u_longitude);
    float sinLon = sin(u_longitude);
    float x1 = a_position.x * cosLon - a_position.z * sinLon;
    float z1 = a_position.x * sinLon + a_position.z * cosLon;
    float cosLat = cos(u_latitude);
    float sinLat = sin(u_latitude);
    float y2 = a_position.y * cosLat - z1 * sinLat;
    float z2 = a_position.y * sinLat + z1 * cosLat;
    vec2 pixel = u_origin + vec2(x1, -y2) * u_scale;
    vec2 clip = vec2(pixel.x / u_size.x * 2.0 - 1.0, 1.0 - pixel.y / u_size.y * 2.0);
    gl_Position = vec4(clip, -z2, 1.0);
    v_uv = a_uv;
  }
`
const SATELLITE_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  varying vec2 v_uv;
  void main() { gl_FragColor = texture2D(u_texture, v_uv); }
`

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source); gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null }
  return shader
}

function initializeSatelliteRenderer(cache: SatelliteCache): boolean {
  if (!cache.canvas) cache.canvas = document.createElement('canvas')
  const gl = cache.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true })
  if (!gl) return false
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, SATELLITE_VERTEX_SHADER)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, SATELLITE_FRAGMENT_SHADER)
  if (!vertexShader || !fragmentShader) return false
  const program = gl.createProgram()
  if (!program) return false
  gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader); gl.linkProgram(program)
  gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false

  const longitudeSegments = 96
  const latitudeSegments = 48
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let latitudeIndex = 0; latitudeIndex <= latitudeSegments; latitudeIndex += 1) {
    const latitude = -Math.PI / 2 + Math.PI * latitudeIndex / latitudeSegments
    const cosLatitude = Math.cos(latitude)
    for (let longitudeIndex = 0; longitudeIndex <= longitudeSegments; longitudeIndex += 1) {
      const longitude = -Math.PI + Math.PI * 2 * longitudeIndex / longitudeSegments
      positions.push(cosLatitude * Math.sin(longitude), Math.sin(latitude), cosLatitude * Math.cos(longitude))
      uvs.push(longitudeIndex / longitudeSegments, latitudeIndex / latitudeSegments)
    }
  }
  for (let latitudeIndex = 0; latitudeIndex < latitudeSegments; latitudeIndex += 1) {
    for (let longitudeIndex = 0; longitudeIndex < longitudeSegments; longitudeIndex += 1) {
      const first = latitudeIndex * (longitudeSegments + 1) + longitudeIndex
      const second = first + longitudeSegments + 1
      indices.push(first, second, first + 1, second, second + 1, first + 1)
    }
  }
  cache.gl = gl; cache.program = program; cache.indexCount = indices.length
  cache.positionBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cache.positionBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  cache.uvBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cache.uvBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW)
  cache.indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  cache.texture = gl.createTexture()
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS)
  return true
}

function satelliteLayer(projection: ReturnType<typeof geoOrthographic>, image: HTMLImageElement, viewCenter: SphericalCoordinate, cache: SatelliteCache, layout: FrameLayout): HTMLCanvasElement | null {
  if ((!cache.gl || !cache.program || !cache.canvas) && !initializeSatelliteRenderer(cache)) return null
  const { canvas, gl, program } = cache
  if (!canvas || !gl || !program) return null
  if (canvas.width !== layout.width || canvas.height !== layout.height) { canvas.width = layout.width; canvas.height = layout.height }
  gl.viewport(0, 0, canvas.width, canvas.height)
  if (cache.sourceImage !== image.src && cache.texture) {
    gl.bindTexture(gl.TEXTURE_2D, cache.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    cache.sourceImage = image.src
  }
  gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.useProgram(program)
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  const uvLocation = gl.getAttribLocation(program, 'a_uv')
  gl.bindBuffer(gl.ARRAY_BUFFER, cache.positionBuffer); gl.enableVertexAttribArray(positionLocation); gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ARRAY_BUFFER, cache.uvBuffer); gl.enableVertexAttribArray(uvLocation); gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.indexBuffer)
  gl.uniform2f(gl.getUniformLocation(program, 'u_size'), layout.width, layout.height)
  gl.uniform2f(gl.getUniformLocation(program, 'u_origin'), layout.globeCenter[0], layout.globeCenter[1])
  gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), projection.scale())
  gl.uniform1f(gl.getUniformLocation(program, 'u_longitude'), viewCenter[0] * Math.PI / 180)
  gl.uniform1f(gl.getUniformLocation(program, 'u_latitude'), viewCenter[1] * Math.PI / 180)
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cache.texture)
  gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0)
  gl.drawElements(gl.TRIANGLES, cache.indexCount, gl.UNSIGNED_SHORT, 0)
  return canvas
}

function drawGlobe(context: CanvasRenderingContext2D, projection: ReturnType<typeof geoOrthographic>, theme: MapTheme, satelliteImage: HTMLImageElement | null, viewCenter: SphericalCoordinate, satelliteCache: SatelliteCache, layout: FrameLayout): void {
  const colors = THEMES[theme]; const path = geoPath(projection, context)
  context.save(); context.shadowBlur = 35; context.shadowColor = colors.atmosphere; context.beginPath(); path({ type: 'Sphere' }); context.fillStyle = colors.ocean; context.fill(); context.restore()
  context.save(); context.beginPath(); path({ type: 'Sphere' }); context.clip()
  const satellite = satelliteImage ? satelliteLayer(projection, satelliteImage, viewCenter, satelliteCache, layout) : null
  if (satellite) context.drawImage(satellite, 0, 0)
  else { context.beginPath(); path(LAND); context.fillStyle = colors.land; context.fill() }
  const oceanLight = context.createRadialGradient(layout.globeCenter[0] - 90, layout.globeCenter[1] - 110, 20, layout.globeCenter[0], layout.globeCenter[1], projection.scale())
  oceanLight.addColorStop(0, theme === 'minimal' ? 'rgba(255,255,255,.3)' : 'rgba(110,195,235,.12)'); oceanLight.addColorStop(1, theme === 'minimal' ? 'rgba(20,35,45,.08)' : 'rgba(0,4,10,.32)'); context.fillStyle = oceanLight; context.fillRect(layout.globeCenter[0] - projection.scale(), layout.globeCenter[1] - projection.scale(), projection.scale() * 2, projection.scale() * 2)
  context.beginPath(); path(GRATICULE); context.strokeStyle = colors.grid; context.lineWidth = .8; context.stroke()
  context.beginPath(); path(BORDERS); context.strokeStyle = satelliteImage ? 'rgba(220,241,252,.44)' : colors.border; context.globalAlpha = .8; context.lineWidth = .65; context.stroke(); context.restore()
  context.beginPath(); path({ type: 'Sphere' }); context.strokeStyle = theme === 'minimal' ? 'rgba(55,88,102,.36)' : 'rgba(125,211,252,.42)'; context.lineWidth = 1.5; context.stroke()
}

function drawMarker(context: CanvasRenderingContext2D, x: number, y: number, label: string, active: boolean, pulse: number, theme: MapTheme): void {
  const colors = THEMES[theme]; context.save()
  if (pulse > 0) { context.beginPath(); context.arc(x, y, 11 + pulse * 27, 0, Math.PI * 2); context.strokeStyle = `rgba(216,180,119,${.58 * (1 - pulse)})`; context.lineWidth = 3; context.stroke() }
  context.shadowBlur = active ? 18 : 10; context.shadowColor = active ? '#d8b477' : '#9bd7e1'; context.beginPath(); context.arc(x, y, active ? 7 : 5, 0, Math.PI * 2); context.fillStyle = active ? '#e5c58d' : '#9bd7e1'; context.fill()
  context.shadowBlur = 0; context.font = '600 16px Inter, system-ui, sans-serif'; context.textAlign = 'center'; context.fillStyle = colors.text; context.fillText(label, x, y - 16); context.restore()
}

function drawHud(context: CanvasRenderingContext2D, trip: Trip, timeline: TimelineState, layout: FrameLayout): void {
  const colors = THEMES[trip.theme]; const index = Math.min(timeline.segmentIndex, Math.max(0, trip.locations.length - 2)); const from = trip.locations[index]; const to = trip.locations[index + 1]; const transport = trip.legs[index]?.transport ?? 'plane'
  context.save(); context.fillStyle = trip.theme === 'minimal' ? 'rgba(255,255,255,.9)' : 'rgba(7,16,25,.9)'; context.strokeStyle = trip.theme === 'minimal' ? 'rgba(50,70,80,.18)' : 'rgba(255,255,255,.12)'; context.lineWidth = 1; context.beginPath(); context.roundRect(40, 40, 350, 132, 14); context.fill(); context.stroke()
    context.fillStyle = trip.theme === 'minimal' ? '#52636c' : '#9babb5'; context.font = '500 13px Inter, system-ui'; context.fillText(`VoyaFrame  ·  ${trip.language === 'zh' ? '行程预览' : 'Journey preview'}`, 64, 70)
  context.fillStyle = colors.text; context.font = '700 24px Inter, system-ui'; context.fillText(from && to ? `${locationName(from, trip.language)}  →  ${locationName(to, trip.language)}` : trip.name, 64, 108)
  context.fillStyle = trip.theme === 'minimal' ? '#607580' : '#9bb4c4'; context.font = '500 13px Inter, system-ui'; context.fillText(`${t(trip.language, transport)}  ·  ${t(trip.language, 'leg')} ${trip.locations.length > 1 ? index + 1 : 0}/${Math.max(0, trip.locations.length - 1)}`, 64, 139)
  const barX = 40, barY = layout.height - 49, barW = layout.width - 80; context.fillStyle = trip.theme === 'minimal' ? 'rgba(40,60,70,.14)' : 'rgba(255,255,255,.14)'; context.beginPath(); context.roundRect(barX, barY, barW, 5, 3); context.fill()
  const gradient = context.createLinearGradient(barX, 0, barX + barW, 0); gradient.addColorStop(0, '#9bd7e1'); gradient.addColorStop(1, '#d8b477'); context.fillStyle = gradient; context.beginPath(); context.roundRect(barX, barY, barW * timeline.progress, 5, 3); context.fill()
  context.fillStyle = colors.text; context.font = '600 14px Inter, system-ui'; context.fillText(formatTime(timeline.time), barX, layout.height - 15); context.textAlign = 'right'; context.fillText(formatTime(timeline.totalDuration), barX + barW, layout.height - 15); context.restore()
  context.save(); context.textAlign = 'right'; context.font = '500 10px Inter, system-ui'; context.fillStyle = trip.theme === 'minimal' ? 'rgba(25,45,55,.52)' : 'rgba(220,240,250,.48)'; context.fillText('SATELLITE IMAGERY · NASA EARTH OBSERVATORY', layout.width - 40, layout.height - 70); context.restore()
}

function fitText(context: CanvasRenderingContext2D, value: string, maximumWidth: number): string {
  if (context.measureText(value).width <= maximumWidth) return value
  let result = value
  while (result.length > 1 && context.measureText(`${result}…`).width > maximumWidth) result = result.slice(0, -1)
  return `${result}…`
}

function overlayOpacity(progress: number, fadeOut = true): number {
  const fadeIn = smoothstep(progress / .22)
  return fadeOut ? Math.min(fadeIn, smoothstep((1 - progress) / .14)) : fadeIn
}

function drawIntro(context: CanvasRenderingContext2D, trip: Trip, timeline: TimelineState, layout: FrameLayout): void {
  const alpha = overlayOpacity(timeline.introProgress)
  const compact = layout.width < 800
  context.save(); context.globalAlpha = alpha
  const veil = context.createLinearGradient(0, 0, 0, layout.height)
  veil.addColorStop(0, 'rgba(3,10,16,.76)'); veil.addColorStop(.5, 'rgba(3,10,16,.28)'); veil.addColorStop(1, 'rgba(3,10,16,.74)')
  context.fillStyle = veil; context.fillRect(0, 0, layout.width, layout.height)
  context.textAlign = 'center'; context.fillStyle = '#9bd7e1'; context.font = `600 ${compact ? 14 : 16}px Inter, system-ui`; context.fillText('VOYAFRAME  ·  JOURNEY', layout.width / 2, layout.height * .32)
  context.fillStyle = '#f2f6f7'; context.font = `700 ${compact ? 40 : 56}px Inter, "PingFang SC", system-ui`; context.fillText(fitText(context, trip.name, layout.width - 96), layout.width / 2, layout.height * .45)
  if (trip.story.subtitle) { context.fillStyle = 'rgba(237,242,243,.72)'; context.font = `400 ${compact ? 17 : 21}px Inter, "PingFang SC", system-ui`; context.fillText(fitText(context, trip.story.subtitle, layout.width - 110), layout.width / 2, layout.height * .52) }
  if (trip.story.traveler) { context.fillStyle = 'rgba(216,180,119,.86)'; context.font = `500 ${compact ? 13 : 15}px Inter, system-ui`; context.fillText(`${t(trip.language, 'byTraveler')}  ${trip.story.traveler}`, layout.width / 2, layout.height * .63) }
  context.beginPath(); context.moveTo(layout.width / 2 - 34, layout.height * .57); context.lineTo(layout.width / 2 + 34, layout.height * .57); context.strokeStyle = 'rgba(155,215,225,.48)'; context.lineWidth = 1; context.stroke(); context.restore()
}

function drawOutro(context: CanvasRenderingContext2D, trip: Trip, timeline: TimelineState, layout: FrameLayout): void {
  const alpha = overlayOpacity(timeline.outroProgress, false)
  const stats = calculateTripStats(trip)
  const compact = layout.width < 800
  const cardWidth = Math.min(layout.width - 64, compact ? 640 : 820)
  const cardHeight = compact ? 350 : 300
  const cardX = (layout.width - cardWidth) / 2
  const cardY = (layout.height - cardHeight) / 2
  context.save(); context.globalAlpha = alpha
  context.fillStyle = 'rgba(2,8,13,.64)'; context.fillRect(0, 0, layout.width, layout.height)
  context.fillStyle = 'rgba(7,16,25,.9)'; context.strokeStyle = 'rgba(155,215,225,.22)'; context.lineWidth = 1; context.beginPath(); context.roundRect(cardX, cardY, cardWidth, cardHeight, 22); context.fill(); context.stroke()
  context.textAlign = 'center'; context.fillStyle = '#d8b477'; context.font = `600 ${compact ? 13 : 15}px Inter, system-ui`; context.fillText(t(trip.language, 'journeySummary').toUpperCase(), layout.width / 2, cardY + 48)
  context.fillStyle = '#f2f6f7'; context.font = `700 ${compact ? 30 : 38}px Inter, "PingFang SC", system-ui`; context.fillText(fitText(context, trip.name, cardWidth - 64), layout.width / 2, cardY + 96)
  if (trip.story.showStats) {
    const values = [stats.cities, stats.countries, stats.distanceKm.toLocaleString(), stats.legs]
    const labels = [t(trip.language, 'citiesStat'), t(trip.language, 'countriesStat'), `${t(trip.language, 'distanceStat')} · km`, t(trip.language, 'legsStat')]
    const columns = compact ? 2 : 4
    values.forEach((value, index) => {
      const row = Math.floor(index / columns); const column = index % columns; const cellWidth = cardWidth / columns; const x = cardX + cellWidth * (column + .5); const y = cardY + 170 + row * 94
      context.fillStyle = '#9bd7e1'; context.font = `650 ${compact ? 25 : 28}px Inter, system-ui`; context.fillText(String(value), x, y)
      context.fillStyle = 'rgba(237,242,243,.52)'; context.font = '500 12px Inter, "PingFang SC", system-ui'; context.fillText(labels[index], x, y + 25)
    })
  }
  if (trip.story.traveler) { context.fillStyle = 'rgba(237,242,243,.6)'; context.font = '500 13px Inter, "PingFang SC", system-ui'; context.fillText(`${t(trip.language, 'byTraveler')}  ${trip.story.traveler}`, layout.width / 2, cardY + cardHeight - 28) }
  context.restore()
}

function drawStoryCard(context: CanvasRenderingContext2D, trip: Trip, timeline: TimelineState, layout: FrameLayout, image: HTMLImageElement | undefined): void {
  const location = trip.locations[timeline.segmentIndex + 1]
  if (!location || (!location.story && !location.date && !image)) return
  const alpha = smoothstep(Math.min(1, timeline.holdProgress / .24))
  const width = Math.min(430, layout.width - 64); const height = 220; const x = 32; const y = layout.height - height - 84
  const imageWidth = image ? Math.min(170, width * .42) : 0
  context.save(); context.globalAlpha = alpha; context.fillStyle = 'rgba(7,16,25,.92)'; context.strokeStyle = 'rgba(255,255,255,.14)'; context.lineWidth = 1; context.beginPath(); context.roundRect(x, y, width, height, 18); context.fill(); context.stroke()
  if (image) {
    context.save(); context.beginPath(); context.roundRect(x, y, imageWidth, height, [18, 0, 0, 18]); context.clip()
    const scale = Math.max(imageWidth / image.naturalWidth, height / image.naturalHeight); const drawWidth = image.naturalWidth * scale; const drawHeight = image.naturalHeight * scale
    context.drawImage(image, x + (imageWidth - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight); context.restore()
  }
  const textX = x + imageWidth + 24; const textWidth = width - imageWidth - 48
  context.textAlign = 'left'; context.fillStyle = '#d8b477'; context.font = '600 12px Inter, system-ui'; context.fillText(location.date || t(trip.language, 'locationStory'), textX, y + 40)
  context.fillStyle = '#f2f6f7'; context.font = '700 25px Inter, "PingFang SC", system-ui'; context.fillText(fitText(context, locationName(location, trip.language), textWidth), textX, y + 78)
  if (location.story) {
    context.fillStyle = 'rgba(237,242,243,.7)'; context.font = '400 14px Inter, "PingFang SC", system-ui'
    const words = [...location.story]; let line = ''; let lineIndex = 0
    for (const word of words) { const next = line + word; if (context.measureText(next).width > textWidth && line) { context.fillText(line, textX, y + 112 + lineIndex * 24); line = word; lineIndex += 1; if (lineIndex >= 3) break } else line = next }
    if (lineIndex < 3 && line) context.fillText(fitText(context, line, textWidth), textX, y + 112 + lineIndex * 24)
  }
  context.restore()
}

export function MapCanvas({ trip, timeline, status, canvasRef, disabled }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; longitude: number; latitude: number } | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)
  const satelliteCacheRef = useRef<SatelliteCache>({ canvas: null, gl: null, program: null, positionBuffer: null, uvBuffer: null, indexBuffer: null, texture: null, indexCount: 0, sourceImage: '' })
  const [manualRotation, setManualRotation] = useState<SphericalCoordinate>([0, 0])
  const [zoom, setZoom] = useState(1)
  const [satelliteImage, setSatelliteImage] = useState<HTMLImageElement | null>(null)
  const previousStatusRef = useRef<AnimationStatus>(status)
  const previousTimeRef = useRef(timeline.time)
  const mobile = useMediaQuery('(max-width: 1023px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const layout = FRAME_LAYOUTS[trip.aspectRatio]
  const mediaImages = useTripMediaImages(trip.locations)
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
    const projection = geoOrthographic().translate(layout.globeCenter).scale(layout.baseRadius * automatic.zoom * (cameraLocked ? 1 : zoom)).rotate([-viewCenter[0], -viewCenter[1], 0]).clipAngle(90).precision(.35)
    context.clearRect(0, 0, layout.width, layout.height); drawBackground(context, trip.theme, layout); drawGlobe(context, projection, trip.theme, satelliteImage, viewCenter, satelliteCacheRef.current, layout)
    routeCoordinates.forEach((coordinates, index) => {
      const style = trip.legs[index]?.routeStyle ?? 'glow'
      if (timeline.phase === 'completed' || timeline.phase === 'outro' || index < timeline.segmentIndex) drawCompletedRoute(context, projection, viewCenter, coordinates, style)
      else if (index === timeline.segmentIndex && (timeline.phase === 'flight' || timeline.phase === 'hold')) drawActiveRoute(context, projection, viewCenter, coordinates, timeline.segmentProgress, style)
      else drawFutureRoute(context, projection, viewCenter, coordinates)
    })
    trip.locations.forEach((location, index) => {
      const reached = timeline.phase === 'idle' || timeline.phase === 'intro' || timeline.phase === 'outro' || timeline.phase === 'completed' || index <= timeline.segmentIndex + 1; if (!reached) return
      const point = projectVisiblePoint(projection, viewCenter, [location.longitude, location.latitude]); if (!point) return
      const destination = index === timeline.segmentIndex + 1 && (timeline.phase === 'flight' || timeline.phase === 'hold'); const arrival = destination && timeline.segmentProgress > .88 ? (now / 900) % 1 : 0
      const relatedLeg = trip.legs[Math.max(0, index - 1)]
      const showLabel = (relatedLeg?.labelTiming ?? 'always') === 'always' || timeline.phase === 'idle' || timeline.phase === 'completed' || destination || index <= timeline.segmentIndex
      drawMarker(context, point.x, point.y, showLabel ? locationName(location, trip.language) : '', destination, arrival, trip.theme)
    })
    if ((timeline.phase === 'flight' || timeline.phase === 'hold') && routeCoordinates[timeline.segmentIndex]) {
      const coordinates = routeCoordinates[timeline.segmentIndex]
      const tangentStep = Math.max(.0015, 1 / Math.max(240, coordinates.length * 6))
      const currentCoordinate = coordinateAtProgress(coordinates, timeline.segmentProgress)
      const beforeCoordinate = coordinateAtProgress(coordinates, Math.max(0, timeline.segmentProgress - tangentStep))
      const afterCoordinate = coordinateAtProgress(coordinates, Math.min(1, timeline.segmentProgress + tangentStep))
      const point = projectVisiblePoint(projection, viewCenter, currentCoordinate)
      const before = projectVisiblePoint(projection, viewCenter, beforeCoordinate)
      const after = projectVisiblePoint(projection, viewCenter, afterCoordinate)
      if (point) {
        const angle = before && after ? Math.atan2(after.y - before.y, after.x - before.x) : after ? Math.atan2(after.y - point.y, after.x - point.x) : 0
        drawVehicle(context, point, angle, trip.legs[timeline.segmentIndex]?.transport ?? 'plane')
      }
    }
    if (timeline.phase === 'hold') { const destination = trip.locations[timeline.segmentIndex + 1]; drawStoryCard(context, trip, timeline, layout, destination?.photoAssetId ? mediaImages.get(destination.photoAssetId) : undefined) }
    if ((!mobile || status === 'recording') && timeline.phase !== 'intro' && timeline.phase !== 'outro') drawHud(context, trip, timeline, layout)
    if (timeline.phase === 'intro') drawIntro(context, trip, timeline, layout)
    if (timeline.phase === 'outro') drawOutro(context, trip, timeline, layout)
  }, [cameraLocked, layout, manualRotation, mediaImages, mobile, routeCoordinates, satelliteImage, status, timeline, trip, zoom])
  useCanvasRenderer(canvasRef, draw, status === 'recording' ? 60 : mobile || reducedMotion ? 30 : 60)

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || cameraLocked) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointersRef.current.values()]
    if (points.length === 2) {
      pinchRef.current = { distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), zoom }
      dragRef.current = null
    } else dragRef.current = { x: event.clientX, y: event.clientY, longitude: manualRotation[0], latitude: manualRotation[1] }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointersRef.current.values()]
    if (points.length === 2 && pinchRef.current) {
      const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
      setZoom(Math.max(.7, Math.min(1.65, pinchRef.current.zoom * distance / Math.max(1, pinchRef.current.distance))))
      return
    }
    const drag = dragRef.current
    if (drag) setManualRotation([drag.longitude - (event.clientX - drag.x) * .28, Math.max(-70, Math.min(70, drag.latitude + (event.clientY - drag.y) * .22))])
  }
  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(event.pointerId)
    pinchRef.current = null
    dragRef.current = null
  }
  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => { if (disabled || cameraLocked) return; setZoom((value) => Math.max(.7, Math.min(1.65, value * Math.exp(-event.deltaY * .001)))) }
  const changeZoom = (factor: number) => setZoom((value) => Math.max(.7, Math.min(1.65, value * factor)))
  const toggleFullscreen = () => { if (!document.fullscreenElement) void wrapperRef.current?.requestFullscreen(); else void document.exitFullscreen() }

  return <div ref={wrapperRef} className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-[#071018]">
    <canvas ref={canvasRef} width={layout.width} height={layout.height} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} className="block h-full max-h-full w-full touch-none object-contain object-center active:cursor-grabbing" aria-label={t(trip.language, 'canvasLabel')} />
    <div className="absolute right-3 top-[calc(.75rem+env(safe-area-inset-top))] flex items-center gap-2 sm:right-4 sm:top-4">
      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-[#09131c]/90 shadow-[0_8px_24px_rgba(0,0,0,.2)]"><button type="button" onClick={() => changeZoom(1.12)} disabled={disabled || cameraLocked} className="flex h-11 w-11 items-center justify-center text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-35" aria-label={t(trip.language, 'zoomIn')}><Icon name="zoomIn" size={17} /></button><button type="button" onClick={() => changeZoom(.89)} disabled={disabled || cameraLocked} className="flex h-11 w-11 items-center justify-center border-l border-white/10 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-35" aria-label={t(trip.language, 'zoomOut')}><Icon name="zoomOut" size={17} /></button><button type="button" onClick={() => { setZoom(1); setManualRotation([0, 0]) }} disabled={disabled || cameraLocked} className="flex h-11 w-11 items-center justify-center border-l border-white/10 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-35" aria-label={t(trip.language, 'reset')} title={t(trip.language, 'reset')}><Icon name="reset" size={17} /></button></div>
      {'fullscreenEnabled' in document && <button type="button" onClick={toggleFullscreen} disabled={disabled} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#09131c]/90 text-white/70 shadow-[0_8px_24px_rgba(0,0,0,.2)] transition-colors hover:bg-[#111f29] hover:text-white disabled:opacity-35" aria-label={t(trip.language, 'fullscreen')} title={t(trip.language, 'fullscreen')}><Icon name="expand" size={17} /></button>}
    </div>
    <div className="gesture-hint pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#09131c]/80 px-3 py-1.5 text-[11px] text-white/50 sm:block">{t(trip.language, 'gesture')}</div>
  </div>
}
