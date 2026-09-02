import { formatTime } from '../lib/animationTimeline'
import { t } from '../lib/i18n'
import type { AnimationStatus, Language, TimelineState } from '../types'
import { Icon } from './Icon'

interface Props { timeline: TimelineState; status: AnimationStatus; language: Language; segmentCount: number; disabled?: boolean; onSeek: (time: number) => void; onPlay: () => void; onPause: () => void }
export function TimelineControls({ timeline, status, language, segmentCount, disabled, onSeek, onPlay, onPause }: Props) {
  const playing = status === 'playing' || status === 'recording'
  return <div className="flex h-[76px] shrink-0 items-center gap-3 border-t border-[var(--border)] bg-[var(--panel)] px-4 text-[var(--text)] sm:gap-4 sm:px-6">
    <button type="button" disabled={disabled} onClick={playing ? onPause : onPlay} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--text)] text-[var(--app-bg)] transition-colors duration-200 hover:bg-[var(--accent-strong)] disabled:opacity-40" aria-label={t(language, playing ? 'pause' : 'play')}><Icon name={playing ? 'pause' : 'play'} size={18} /></button>
    <div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between text-xs font-medium tabular-nums text-[var(--text-muted)]"><span>{formatTime(timeline.time)} <span className="text-[var(--text-faint)]">/ {formatTime(timeline.totalDuration)}</span></span><span>{timeline.phase === 'intro' ? t(language, 'intro') : timeline.phase === 'outro' ? t(language, 'outro') : <>{t(language, 'leg')} {segmentCount ? timeline.segmentIndex + 1 : 0}<span className="text-[var(--text-faint)]"> / {segmentCount}</span></>}</span></div><input type="range" min={0} max={timeline.totalDuration || 1} step={.01} value={timeline.time} disabled={disabled} onChange={(event) => onSeek(Number(event.target.value))} className="timeline-range" aria-label={`${t(language, 'play')} progress`} /></div>
  </div>
}
