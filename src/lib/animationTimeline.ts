import type { Speed, TimelineState, TripLeg, TripStory } from '../types'

export const HOLD_DURATION = 1
export const SEGMENT_DURATION: Record<Speed, number> = { fast: 2, standard: 4, slow: 6 }

export function legDuration(leg: TripLeg | undefined, speed: Speed): number {
  return Math.max(1, leg?.duration ?? SEGMENT_DURATION[speed])
}

export function legHoldDuration(leg: TripLeg | undefined): number {
  return Math.max(0, leg?.holdDuration ?? HOLD_DURATION)
}

export function getRouteDuration(legs: TripLeg[], speed: Speed): number {
  return legs.reduce((total, leg) => total + legDuration(leg, speed) + legHoldDuration(leg), 0)
}

export function getTotalDuration(legs: TripLeg[], speed: Speed, story: Pick<TripStory, 'introDuration' | 'outroDuration'>): number {
  return Math.max(0, story.introDuration) + getRouteDuration(legs, speed) + Math.max(0, story.outroDuration)
}

const baseState = (time: number, totalDuration: number, progress: number, segmentIndex = 0): Omit<TimelineState, 'phase'> => ({ time, totalDuration, progress, segmentIndex, segmentProgress: 0, holdProgress: 0, introProgress: 0, outroProgress: 0 })

export function getTimelineState(time: number, legs: TripLeg[], speed: Speed, story: Pick<TripStory, 'introDuration' | 'outroDuration'>): TimelineState {
  const segmentCount = legs.length
  const introDuration = Math.max(0, story.introDuration)
  const outroDuration = Math.max(0, story.outroDuration)
  const routeDuration = getRouteDuration(legs, speed)
  const totalDuration = introDuration + routeDuration + outroDuration
  const safeTime = Math.max(0, Math.min(time, totalDuration))
  if (!segmentCount || safeTime <= 0) {
    return { ...baseState(safeTime, totalDuration, 0), phase: 'idle' }
  }
  if (safeTime >= totalDuration) {
    return { ...baseState(safeTime, totalDuration, 1, Math.max(0, segmentCount - 1)), segmentProgress: 1, holdProgress: 1, introProgress: 1, outroProgress: 1, phase: 'completed' }
  }
  if (introDuration > 0 && safeTime < introDuration) return { ...baseState(safeTime, totalDuration, safeTime / totalDuration), introProgress: safeTime / introDuration, phase: 'intro' }
  const routeTime = safeTime - introDuration
  if (routeTime >= routeDuration) return { ...baseState(safeTime, totalDuration, safeTime / totalDuration, Math.max(0, segmentCount - 1)), segmentProgress: 1, holdProgress: 1, introProgress: 1, outroProgress: outroDuration ? (routeTime - routeDuration) / outroDuration : 1, phase: 'outro' }
  let segmentIndex = 0
  let elapsedBefore = 0
  for (; segmentIndex < segmentCount - 1; segmentIndex += 1) {
    const block = legDuration(legs[segmentIndex], speed) + legHoldDuration(legs[segmentIndex])
    if (routeTime < elapsedBefore + block) break
    elapsedBefore += block
  }
  const flightDuration = legDuration(legs[segmentIndex], speed)
  const holdDuration = legHoldDuration(legs[segmentIndex])
  const localTime = routeTime - elapsedBefore
  const isFlight = localTime < flightDuration
  return {
    time: safeTime,
    totalDuration,
    progress: totalDuration ? safeTime / totalDuration : 0,
    segmentIndex,
    segmentProgress: isFlight ? localTime / flightDuration : 1,
    holdProgress: isFlight ? 0 : holdDuration ? Math.min(1, (localTime - flightDuration) / holdDuration) : 1,
    introProgress: 1,
    outroProgress: 0,
    phase: isFlight ? 'flight' : 'hold',
  }
}

export function formatTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
