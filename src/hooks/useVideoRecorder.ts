import { useCallback, useRef, useState } from 'react'
import { getRecordingSupport, startCanvasRecording, type RecordingSession } from '../services/recordingService'
import { t } from '../lib/i18n'
import type { Language } from '../types'

export function useVideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<RecordingSession | null>(null)
  const support = getRecordingSupport()
  const start = useCallback((canvas: HTMLCanvasElement, tripName: string, language: Language) => {
    setError(null)
    try {
      const session = startCanvasRecording(canvas, tripName)
      if (!session) { setError(t(language, 'unsupported')); return false }
      sessionRef.current = session; setIsRecording(true); return true
    } catch (reason) { setError(reason instanceof Error ? reason.message : t(language, 'cannotStart')); return false }
  }, [])
  const finish = useCallback(async (download = true) => {
    const session = sessionRef.current; sessionRef.current = null
    if (session) await session.stop(download)
    setIsRecording(false)
  }, [])
  const clearError = useCallback(() => setError(null), [])
  return { isRecording, error, support, start, finish, clearError }
}
