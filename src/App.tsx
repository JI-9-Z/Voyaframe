import { useEffect, useRef, useState } from 'react'
import { ExportDialog } from './components/ExportDialog'
import { ComplianceFooter } from './components/ComplianceFooter'
import { LegalDocument, type LegalPage } from './components/LegalDocument'
import { MapCanvas } from './components/MapCanvas'
import { TimelineControls } from './components/TimelineControls'
import { TripEditor } from './components/TripEditor'
import { TripInfoCard } from './components/TripInfoCard'
import { useTripAnimation } from './hooks/useTripAnimation'
import { useVideoRecorder } from './hooks/useVideoRecorder'
import { loadTrip, saveTrip } from './services/localStorageService'
import type { Trip } from './types'

function currentLegalPage(): LegalPage | null {
  if (window.location.hash === '#/privacy') return 'privacy'
  if (window.location.hash === '#/terms') return 'terms'
  return null
}

export default function App() {
  const [legalPage, setLegalPage] = useState<LegalPage | null>(() => currentLegalPage())

  useEffect(() => {
    const syncLegalPage = () => setLegalPage(currentLegalPage())
    window.addEventListener('hashchange', syncLegalPage)
    return () => window.removeEventListener('hashchange', syncLegalPage)
  }, [])

  return legalPage ? <LegalDocument page={legalPage} /> : <TravelMotionApp />
}

function TravelMotionApp() {
  const [trip, setTrip] = useState<Trip>(() => loadTrip())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animation = useTripAnimation(Math.max(0, trip.locations.length - 1), trip.speed)
  const recorder = useVideoRecorder()

  useEffect(() => {
    const timeout = window.setTimeout(() => saveTrip(trip), 250)
    return () => window.clearTimeout(timeout)
  }, [trip])

  useEffect(() => {
    document.documentElement.lang = trip.language === 'zh' ? 'zh-CN' : 'en'
  }, [trip.language])

  useEffect(() => {
    if (animation.status === 'completed' && recorder.isRecording) void recorder.finish(true)
  }, [animation.status, recorder.isRecording, recorder.finish])

  const updateTrip = (nextTrip: Trip) => {
    if (recorder.isRecording) return
    setTrip(nextTrip)
    animation.seek(0)
  }

  const startExport = () => {
    if (!canvasRef.current || trip.locations.length < 2) return
    animation.seek(0)
    requestAnimationFrame(() => {
      if (canvasRef.current && recorder.start(canvasRef.current, trip.name, trip.language)) animation.startRecording()
    })
  }

  const cancelExport = async () => {
    await recorder.finish(false)
    animation.stopRecording()
    animation.seek(0)
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#061018] text-white lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="fixed inset-x-0 bottom-0 z-30 h-[44dvh] overflow-hidden rounded-t-3xl border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,.45)] lg:static lg:h-full lg:rounded-none lg:border-t-0 lg:shadow-none">
        <div className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20 lg:hidden" />
        <TripEditor trip={trip} disabled={recorder.isRecording} isPlaying={animation.status === 'playing'} exportFormat={recorder.support.format} onChange={updateTrip} onPlay={animation.play} onPause={animation.pause} onReplay={animation.replay} onExport={startExport} />
      </div>
      <section className="flex h-[60dvh] min-w-0 flex-col lg:h-full">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <MapCanvas trip={trip} timeline={animation.timeline} status={animation.status} canvasRef={canvasRef} disabled={recorder.isRecording} />
          <TripInfoCard trip={trip} timeline={animation.timeline} status={animation.status} />
        </div>
        <TimelineControls timeline={animation.timeline} status={animation.status} language={trip.language} segmentCount={Math.max(0, trip.locations.length - 1)} disabled={recorder.isRecording} onSeek={animation.seek} onPlay={animation.play} onPause={animation.pause} />
        <ComplianceFooter />
      </section>
      <ExportDialog open={recorder.isRecording} progress={animation.timeline.progress} format={recorder.support.format} language={trip.language} error={recorder.error} onCancel={() => void cancelExport()} onClose={recorder.clearError} />
    </main>
  )
}
