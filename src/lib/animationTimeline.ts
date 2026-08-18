import type { Speed, TimelineState } from '../types'

export const HOLD_DURATION = 1
export const SEGMENT_DURATION: Record<Speed, number> = { fast: 2, standard: 4, slow: 6 }

export function getTotalDuration(segmentCount: number, speed: Speed): number {
  if (segmentCount <= 0) return 0
  return segmentCount * (SEGMENT_DURATION[speed] + HOLD_DURATION)
}

export function getTimelineState(time: number, segmentCount: number, speed: Speed): TimelineState {
  const flightDuration = SEGMENT_DURATION[speed]
  const segmentBlock = flightDuration + HOLD_DURATION
  const totalDuration = getTotalDuration(segmentCount, speed)
  const safeTime = Math.max(0, Math.min(time, totalDuration))
  if (!segmentCount || safeTime <= 0) {
    return { time: safeTime, totalDuration, progress: 0, segmentIndex: 0, segmentProgress: 0, holdProgress: 0, phase: 'idle' }
  }
  if (safeTime >= totalDuration) {
    return { time: safeTime, totalDuration, progress: 1, segmentIndex: Math.max(0, segmentCount - 1), segmentProgress: 1, holdProgress: 1, phase: 'completed' }
  }
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(safeTime / segmentBlock))
  const localTime = safeTime - segmentIndex * segmentBlock
  const isFlight = localTime < flightDuration
  return {
    time: safeTime,
    totalDuration,
    progress: totalDuration ? safeTime / totalDuration : 0,
    segmentIndex,
    segmentProgress: isFlight ? localTime / flightDuration : 1,
    holdProgress: isFlight ? 0 : (localTime - flightDuration) / HOLD_DURATION,
    phase: isFlight ? 'flight' : 'hold',
  }
}

export function formatTime(seconds: number): string {
  const value = Math.max(0, Math.round(seconds))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
