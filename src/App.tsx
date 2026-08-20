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
import { usePwa } from './hooks/usePwa'
import { loadTrip, saveTrip } from './services/localStorageService'
import { downloadTripJson, readTripJson } from './services/tripFileService'
import { t } from './lib/i18n'
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
  const historyRef = useRef<Trip[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animation = useTripAnimation(trip.legs, trip.speed)
  const recorder = useVideoRecorder()
  const pwa = usePwa()
  const [drawer, setDrawer] = useState<'collapsed' | 'peek' | 'expanded'>('peek')

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
    historyRef.current = [...historyRef.current.slice(-39), trip]
    setTrip(nextTrip)
    animation.seek(0)
  }

  const undoTrip = () => {
    const previous = historyRef.current[historyRef.current.length - 1]
    if (!previous || recorder.isRecording) return
    historyRef.current = historyRef.current.slice(0, -1)
    setTrip(previous)
    animation.seek(0)
  }

  const importTrip = async (file: File) => {
    try { updateTrip(await readTripJson(file)) }
    catch { window.alert(t(trip.language, 'invalidTripFile')) }
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
    <main className="relative h-[100dvh] overflow-hidden bg-[var(--app-bg)] text-[var(--text)] lg:grid lg:grid-cols-[384px_minmax(0,1fr)]">
      {drawer === 'expanded' && <button type="button" aria-label={trip.language === 'zh' ? '收起编辑面板' : 'Close editor'} onClick={() => setDrawer('peek')} className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px] lg:hidden" />}
      <div className={`mobile-drawer fixed inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-2xl border-t border-[var(--border-strong)] shadow-[0_-16px_48px_rgba(0,0,0,.4)] transition-[height] duration-300 ease-ui lg:static lg:h-full lg:rounded-none lg:border-t-0 lg:shadow-none ${drawer === 'collapsed' ? 'h-[calc(76px+env(safe-area-inset-bottom))]' : drawer === 'expanded' ? 'h-[88dvh]' : 'h-[48dvh]'}`}>
        <div className="absolute left-1/2 top-2 z-20 h-1 w-9 -translate-x-1/2 rounded-full bg-[var(--border-strong)] lg:hidden" />
        <TripEditor trip={trip} disabled={recorder.isRecording} isPlaying={animation.status === 'playing'} exportFormat={recorder.support.format} exportSupported={recorder.support.supported} mobileDrawer={drawer} pwa={pwa} canUndo={historyRef.current.length > 0} onDrawerChange={setDrawer} onChange={updateTrip} onUndo={undoTrip} onImportTrip={(file) => void importTrip(file)} onExportTrip={() => downloadTripJson(trip)} onPlay={animation.play} onPause={animation.pause} onReplay={animation.replay} onExport={startExport} />
      </div>
      <section className="flex h-full min-w-0 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <MapCanvas trip={trip} timeline={animation.timeline} status={animation.status} canvasRef={canvasRef} disabled={recorder.isRecording} />
          <TripInfoCard trip={trip} timeline={animation.timeline} status={animation.status} />
        </div>
        <div className={`${drawer === 'collapsed' ? 'block' : 'hidden'} shrink-0 pb-[calc(76px+env(safe-area-inset-bottom))] lg:block lg:pb-0`}><TimelineControls timeline={animation.timeline} status={animation.status} language={trip.language} segmentCount={Math.max(0, trip.locations.length - 1)} disabled={recorder.isRecording} onSeek={animation.seek} onPlay={animation.play} onPause={animation.pause} /></div>
        <div className="hidden lg:block"><ComplianceFooter /></div>
      </section>
      <ExportDialog open={recorder.isRecording} progress={animation.timeline.progress} format={recorder.support.format} language={trip.language} error={recorder.error} onCancel={() => void cancelExport()} onClose={recorder.clearError} />
    </main>
  )
}
