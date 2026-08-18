import { locationName, t } from '../lib/i18n'
import type { AnimationStatus, TimelineState, Trip } from '../types'

export function TripInfoCard({ trip, timeline, status }: { trip: Trip; timeline: TimelineState; status: AnimationStatus }) {
  const labels = { idle: 'ready', playing: 'playing', paused: 'paused', completed: 'completed', recording: 'recording' } as const
  const location = status === 'completed' ? trip.locations[trip.locations.length - 1] : trip.locations[timeline.segmentIndex]
  return <div className="pointer-events-none absolute left-4 top-4 hidden items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-semibold text-white backdrop-blur md:flex"><span className={`h-1.5 w-1.5 rounded-full ${status === 'recording' ? 'animate-pulse bg-rose-400' : 'bg-emerald-300'}`} />{t(trip.language, labels[status])} · {location ? locationName(location, trip.language) : '—'}</div>
}
