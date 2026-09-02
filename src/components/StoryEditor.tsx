import { useRef, useState } from 'react'
import { deleteMediaAsset, saveMediaFile } from '../services/mediaStorageService'
import { t } from '../lib/i18n'
import type { Trip, TripStory } from '../types'
import { Icon } from './Icon'

interface Props { trip: Trip; disabled?: boolean; onChange: (trip: Trip) => void }

export function StoryEditor({ trip, disabled, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const musicInputRef = useRef<HTMLInputElement>(null)
  const language = trip.language
  const updateStory = <K extends keyof TripStory>(key: K, value: TripStory[K]) => onChange({ ...trip, story: { ...trip.story, [key]: value } })

  const chooseMusic = async (file: File) => {
    setSaving(true); setError(false)
    try {
      const asset = await saveMediaFile(file, 'music')
      await deleteMediaAsset(trip.story.musicAssetId)
      onChange({ ...trip, story: { ...trip.story, musicAssetId: asset.id, musicName: asset.name } })
    } catch { setError(true) }
    finally { setSaving(false) }
  }

  const removeMusic = async () => {
    await deleteMediaAsset(trip.story.musicAssetId).catch(() => undefined)
    onChange({ ...trip, story: { ...trip.story, musicAssetId: undefined, musicName: undefined } })
  }

  return <section className="border-t border-[var(--border)] pt-5">
    <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium text-[var(--text)]"><Icon name="story" size={17} className="text-[var(--warm)]" /><span>{t(language, 'storyStudio')}</span><Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={16} className="ml-auto text-[var(--text-faint)]" /></button>
    {expanded && <div className="space-y-4 pt-3">
      <label><span className="section-label">{t(language, 'subtitle')}</span><input disabled={disabled} value={trip.story.subtitle} maxLength={80} onChange={(event) => updateStory('subtitle', event.target.value)} className="field-input" /></label>
      <label><span className="section-label">{t(language, 'traveler')}</span><input disabled={disabled} value={trip.story.traveler} maxLength={40} onChange={(event) => updateStory('traveler', event.target.value)} className="field-input" /></label>
      <div className="grid grid-cols-2 gap-3">
        <DurationField label={t(language, 'introDuration')} suffix={t(language, 'seconds')} value={trip.story.introDuration} disabled={disabled} onChange={(value) => updateStory('introDuration', value)} />
        <DurationField label={t(language, 'outroDuration')} suffix={t(language, 'seconds')} value={trip.story.outroDuration} disabled={disabled} onChange={(value) => updateStory('outroDuration', value)} />
      </div>
      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text-muted)]"><input type="checkbox" checked={trip.story.showStats} disabled={disabled} onChange={(event) => updateStory('showStats', event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />{t(language, 'showStats')}</label>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="mb-3 flex items-center gap-2"><Icon name="music" size={16} className="text-[var(--accent)]" /><span className="text-xs font-medium text-[var(--text)]">{t(language, 'backgroundMusic')}</span></div>
        {trip.story.musicName && <p className="mb-3 truncate text-xs text-[var(--text-muted)]">{trip.story.musicName}</p>}
        <div className="grid grid-cols-2 gap-2"><button type="button" disabled={disabled || saving} onClick={() => musicInputRef.current?.click()} className="secondary-button !min-h-9 !px-2 !text-xs"><Icon name="upload" size={14} />{t(language, trip.story.musicAssetId ? 'replaceMusic' : 'chooseMusic')}</button><button type="button" disabled={disabled || !trip.story.musicAssetId} onClick={() => void removeMusic()} className="secondary-button !min-h-9 !px-2 !text-xs"><Icon name="trash" size={14} />{t(language, 'removeMusic')}</button></div>
        <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseMusic(file); event.currentTarget.value = '' }} />
        <label className="mt-4 block"><span className="mb-2 flex justify-between text-[11px] text-[var(--text-muted)]"><span>{t(language, 'musicVolume')}</span><span>{Math.round(trip.story.musicVolume * 100)}%</span></span><input type="range" min={0} max={1} step={.05} disabled={disabled || !trip.story.musicAssetId} value={trip.story.musicVolume} onChange={(event) => updateStory('musicVolume', Number(event.target.value))} className="timeline-range" /></label>
      </div>
      {error && <p className="flex gap-2 text-xs leading-5 text-[var(--danger)]"><Icon name="alert" size={15} className="mt-0.5 shrink-0" />{t(language, 'mediaError')}</p>}
      <p className="text-[11px] leading-5 text-[var(--text-faint)]">{t(language, 'mediaStoredLocally')}</p>
    </div>}
  </section>
}

function DurationField({ label, suffix, value, disabled, onChange }: { label: string; suffix: string; value: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <label><span className="section-label">{label}</span><span className="relative block"><input type="number" min={0} max={8} step={.5} value={value} disabled={disabled} onChange={(event) => onChange(Math.max(0, Math.min(8, Number(event.target.value))))} className="field-input !pr-9" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-faint)]">{suffix}</span></span></label>
}
