import { locationName, t } from '../lib/i18n'
import type { AnimationStatus, TimelineState, Trip } from '../types'

export function TripInfoCard({ trip, timeline, status }: { trip: Trip; timeline: TimelineState; status: AnimationStatus }) {
  const labels = { idle: 'ready', playing: 'playing', paused: 'paused', completed: 'completed', recording: 'recording' } as const
  const phaseLabel = timeline.phase === 'intro' ? 'intro' : timeline.phase === 'outro' ? 'outro' : labels[status]
  const location = status === 'completed' || timeline.phase === 'outro' ? trip.locations[trip.locations.length - 1] : trip.locations[timeline.segmentIndex]
  return <div className="pointer-events-none absolute left-3 top-[calc(.75rem+env(safe-area-inset-top))] flex min-h-11 max-w-[42vw] items-center gap-2 rounded-xl border border-white/10 bg-[#09131c]/90 px-3 text-xs font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,.2)] lg:hidden"><span className={`h-2 w-2 shrink-0 rounded-full ${status === 'recording' ? 'animate-pulse bg-[#e38a8a]' : 'bg-[#9bd7e1]'}`} /><span className="truncate">{t(trip.language, phaseLabel)}</span><span className="h-3 w-px shrink-0 bg-white/15" /><span className="truncate text-white/65">{location ? locationName(location, trip.language) : '—'}</span></div>
}
