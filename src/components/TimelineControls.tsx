import { formatTime } from '../lib/animationTimeline'
import { t } from '../lib/i18n'
import type { AnimationStatus, Language, TimelineState } from '../types'

interface Props { timeline: TimelineState; status: AnimationStatus; language: Language; segmentCount: number; disabled?: boolean; onSeek: (time: number) => void; onPlay: () => void; onPause: () => void }
export function TimelineControls({ timeline, status, language, segmentCount, disabled, onSeek, onPlay, onPause }: Props) {
  const playing = status === 'playing' || status === 'recording'
  return <div className="flex h-20 shrink-0 items-center gap-4 border-t border-white/[.07] bg-[#08131c] px-4 text-white sm:px-6">
    <button type="button" disabled={disabled} onClick={playing ? onPause : onPlay} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950 disabled:opacity-40" aria-label={t(language, playing ? 'pause' : 'play')}>{playing ? 'Ⅱ' : '▶'}</button>
    <div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-slate-500"><span>{formatTime(timeline.time)} / {formatTime(timeline.totalDuration)}</span><span>{t(language, 'leg')} {segmentCount ? timeline.segmentIndex + 1 : 0} / {segmentCount}</span></div><input type="range" min={0} max={timeline.totalDuration || 1} step={.01} value={timeline.time} disabled={disabled} onChange={(event) => onSeek(Number(event.target.value))} className="timeline-range" aria-label={`${t(language, 'play')} progress`} /></div>
  </div>
}
