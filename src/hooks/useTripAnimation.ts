import { useCallback, useEffect, useRef, useState } from 'react'
import { getTimelineState, getTotalDuration } from '../lib/animationTimeline'
import type { AnimationStatus, Speed, TripLeg } from '../types'

export function useTripAnimation(legs: TripLeg[], speed: Speed) {
  const segmentCount = legs.length
  const [status, setStatus] = useState<AnimationStatus>('idle')
  const [time, setTime] = useState(0)
  const timeRef = useRef(0)
  const statusRef = useRef<AnimationStatus>('idle')
  const lastFrameRef = useRef<number | null>(null)
  const totalDuration = getTotalDuration(legs, speed)
  const updateStatus = useCallback((next: AnimationStatus) => { statusRef.current = next; setStatus(next) }, [])

  useEffect(() => {
    timeRef.current = Math.min(timeRef.current, totalDuration)
    setTime(timeRef.current)
    if (!segmentCount) updateStatus('idle')
  }, [segmentCount, totalDuration, updateStatus])

  useEffect(() => {
    let frame = 0
    const tick = (now: number) => {
      if (statusRef.current === 'playing' || statusRef.current === 'recording') {
        if (lastFrameRef.current !== null) {
          timeRef.current = Math.min(totalDuration, timeRef.current + (now - lastFrameRef.current) / 1000)
          setTime(timeRef.current)
          if (timeRef.current >= totalDuration) updateStatus('completed')
        }
        lastFrameRef.current = now
      } else lastFrameRef.current = null
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [totalDuration, updateStatus])

  const play = useCallback(() => {
    if (!segmentCount) return
    if (timeRef.current >= totalDuration) { timeRef.current = 0; setTime(0) }
    updateStatus('playing')
  }, [segmentCount, totalDuration, updateStatus])
  const pause = useCallback(() => { if (statusRef.current === 'playing') updateStatus('paused') }, [updateStatus])
  const replay = useCallback(() => { timeRef.current = 0; setTime(0); updateStatus(segmentCount ? 'playing' : 'idle') }, [segmentCount, updateStatus])
  const seek = useCallback((nextTime: number) => {
    const value = Math.max(0, Math.min(nextTime, totalDuration)); timeRef.current = value; setTime(value)
    if (value >= totalDuration && totalDuration > 0) updateStatus('completed')
    else if (statusRef.current === 'completed') updateStatus('paused')
  }, [totalDuration, updateStatus])
  const startRecording = useCallback(() => { timeRef.current = 0; setTime(0); updateStatus('recording') }, [updateStatus])
  const stopRecording = useCallback(() => updateStatus('idle'), [updateStatus])

  return { status, time, totalDuration, timeline: getTimelineState(time, legs, speed), play, pause, replay, seek, startRecording, stopRecording }
}
