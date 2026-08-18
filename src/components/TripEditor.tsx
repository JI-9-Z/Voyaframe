import { useState } from 'react'
import { t } from '../lib/i18n'
import type { Language, Location, MapTheme, Speed, Transport, Trip } from '../types'
import { rebuildLegs } from '../lib/tripModel'
import { LocationList } from './LocationList'
import { LocationSelector } from './LocationSelector'
import { brand } from '../config/site'

interface Props { trip: Trip; disabled?: boolean; isPlaying: boolean; exportFormat: string; onChange: (trip: Trip) => void; onPlay: () => void; onPause: () => void; onReplay: () => void; onExport: () => void }
const fieldLabel = 'mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-slate-500'

export function TripEditor({ trip, disabled, isPlaying, exportFormat, onChange, onPlay, onPause, onReplay, onExport }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const language = trip.language
  const update = <K extends keyof Trip,>(key: K, value: Trip[K]) => onChange({ ...trip, [key]: value })
  const setLocations = (locations: Location[]) => onChange({ ...trip, locations, legs: rebuildLegs(locations, trip.legs) })
  const move = (index: number, direction: -1 | 1) => { const locations = [...trip.locations]; const target = index + direction; [locations[index], locations[target]] = [locations[target], locations[index]]; setLocations(locations) }
  const remove = (index: number) => setLocations(trip.locations.filter((_, itemIndex) => itemIndex !== index))
  const add = (location: Location) => setLocations([...trip.locations, location])
  const setTransport = (index: number, transport: Transport) => update('legs', trip.legs.map((leg, legIndex) => legIndex === index ? { ...leg, transport } : leg))
  return <aside className="flex h-full flex-col border-white/10 bg-[#09131c]/95 text-white backdrop-blur-xl lg:border-r">
    <header className="flex shrink-0 items-center justify-between border-b border-white/[.07] px-5 py-4">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-lg text-[#06111a] shadow-glow">✦</div><div><h1 className="text-base font-bold tracking-tight">{language === 'zh' ? brand.zh : brand.en}</h1><p className="text-[10px] uppercase tracking-[.18em] text-slate-500">Every journey, framed</p></div></div>
      <div className="flex items-center gap-2"><div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5" aria-label={t(language, 'language')}>{(['zh', 'en'] as Language[]).map((item) => <button key={item} type="button" disabled={disabled} onClick={() => update('language', item)} className={`rounded-md px-2 py-1 text-[9px] font-bold transition ${language === item ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}>{item === 'zh' ? '中' : 'EN'}</button>)}</div><span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-1 text-[9px] font-bold text-emerald-200 xl:block">{t(language, 'localDemo')}</span></div>
    </header>
    <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-32 lg:pb-6">
      <section><label className={fieldLabel} htmlFor="trip-name">{t(language, 'tripName')}</label><input id="trip-name" disabled={disabled} value={trip.name} onChange={(event) => update('name', event.target.value)} className="field-input text-base font-semibold" /></section>
      <section><div className="mb-2 flex items-center justify-between"><span className={fieldLabel.replace('mb-2 ', '')}>{t(language, 'routeAndTransport')}</span><span className="text-[10px] text-slate-600">{trip.locations.length} {t(language, 'stops')}</span></div><LocationList locations={trip.locations} legs={trip.legs} language={language} disabled={disabled} onMove={move} onRemove={remove} onTransportChange={setTransport} /><button type="button" disabled={disabled} onClick={() => setSelectorOpen(true)} className="mt-2 w-full rounded-xl border border-dashed border-cyan-300/25 py-2.5 text-xs font-semibold text-cyan-200 hover:border-cyan-300/50 hover:bg-cyan-300/[.05] disabled:opacity-40">{t(language, 'addLocation')}</button></section>
      <div className="grid grid-cols-2 gap-3">
        <label><span className={fieldLabel}>{t(language, 'animationSpeed')}</span><select disabled={disabled} value={trip.speed} onChange={(event) => update('speed', event.target.value as Speed)} className="field-input"><option value="fast">{t(language, 'fast')}</option><option value="standard">{t(language, 'standard')}</option><option value="slow">{t(language, 'slow')}</option></select></label>
        <label><span className={fieldLabel}>{t(language, 'mapTheme')}</span><select disabled={disabled} value={trip.theme} onChange={(event) => update('theme', event.target.value as MapTheme)} className="field-input"><option value="midnight">Midnight</option><option value="ocean">Ocean</option><option value="minimal">Minimal Light</option></select></label>
      </div>
      <section className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
        <div className="grid grid-cols-3 gap-2"><button type="button" disabled={disabled} onClick={isPlaying ? onPause : onPlay} className="primary-button col-span-2">{isPlaying ? `Ⅱ  ${t(language, 'pause')}` : `▶  ${t(language, 'play')}`}</button><button type="button" disabled={disabled} onClick={onReplay} className="secondary-button" title={t(language, 'replay')}>↻</button></div>
        <button type="button" disabled={disabled || trip.locations.length < 2} onClick={onExport} className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-100 disabled:opacity-40">● {t(language, 'exportVideo')} · {exportFormat}</button>
        <p className="mt-2 text-center text-[9px] leading-4 text-slate-600">{t(language, 'browserRecording')}</p>
      </section>
    </div>
    <LocationSelector open={selectorOpen} language={language} disabled={disabled} onClose={() => setSelectorOpen(false)} onSelect={add} />
  </aside>
}
