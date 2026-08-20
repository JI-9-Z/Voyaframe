import { useRef, useState } from 'react'
import { t } from '../lib/i18n'
import type { Language, Location, MapTheme, Speed, Trip } from '../types'
import { rebuildLegs } from '../lib/tripModel'
import { LocationList } from './LocationList'
import { LocationSelector } from './LocationSelector'
import { brand } from '../config/site'
import { BrandMark } from './BrandMark'
import { Icon } from './Icon'
import { TRIP_TEMPLATES, tripFromTemplate } from '../data/tripTemplates'
import type { AspectRatio, TripLeg } from '../types'

interface PwaState { canInstall: boolean; installed: boolean; online: boolean; updateAvailable: boolean; install: () => Promise<boolean>; applyUpdate: () => void }
interface Props { trip: Trip; disabled?: boolean; isPlaying: boolean; exportFormat: string; exportSupported: boolean; mobileDrawer: 'collapsed' | 'peek' | 'expanded'; pwa: PwaState; canUndo: boolean; onDrawerChange: (state: 'collapsed' | 'peek' | 'expanded') => void; onChange: (trip: Trip) => void; onUndo: () => void; onImportTrip: (file: File) => void; onExportTrip: () => void; onPlay: () => void; onPause: () => void; onReplay: () => void; onExport: () => void }

export function TripEditor({ trip, disabled, isPlaying, exportFormat, exportSupported, mobileDrawer, pwa, canUndo, onDrawerChange, onChange, onUndo, onImportTrip, onExportTrip, onPlay, onPause, onReplay, onExport }: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const language = trip.language
  const update = <K extends keyof Trip,>(key: K, value: Trip[K]) => onChange({ ...trip, [key]: value })
  const setLocations = (locations: Location[]) => onChange({ ...trip, locations, legs: rebuildLegs(locations, trip.legs) })
  const move = (index: number, direction: -1 | 1) => { const locations = [...trip.locations]; const target = index + direction; [locations[index], locations[target]] = [locations[target], locations[index]]; setLocations(locations) }
  const reorder = (from: number, to: number) => { const locations = [...trip.locations]; const [moved] = locations.splice(from, 1); locations.splice(to, 0, moved); setLocations(locations) }
  const remove = (index: number) => setLocations(trip.locations.filter((_, itemIndex) => itemIndex !== index))
  const add = (location: Location) => setLocations([...trip.locations, location])
  const setLeg = (index: number, patch: Partial<TripLeg>) => update('legs', trip.legs.map((leg, legIndex) => legIndex === index ? { ...leg, ...patch } : leg))
  const setSpeed = (speed: Speed) => onChange({ ...trip, speed, legs: trip.legs.map(({ duration: _duration, ...leg }) => leg) })
  const applyTemplate = () => { const template = TRIP_TEMPLATES.find((item) => item.id === templateId); if (template) onChange(tripFromTemplate(template, trip, language)) }
  const nextDrawer = mobileDrawer === 'collapsed' ? 'peek' : mobileDrawer === 'peek' ? 'expanded' : 'collapsed'

  return <aside className="flex h-full flex-col border-[var(--border)] bg-[var(--panel)] text-[var(--text)] lg:border-r">
    <header className="flex min-h-[76px] shrink-0 items-center justify-between border-b border-[var(--border)] px-4 pb-3 pt-5 lg:min-h-[72px] lg:px-5 lg:py-4">
      <div className="flex min-w-0 items-center gap-3 text-[var(--accent)]">
        <BrandMark className="h-9 w-9 shrink-0" title={brand.full} />
        <div className="min-w-0"><h1 className="truncate text-[15px] font-semibold tracking-[-.01em] text-[var(--text)]">{language === 'zh' ? brand.zh : brand.en}</h1><p className="mt-0.5 text-[11px] text-[var(--text-faint)]">{language === 'zh' ? brand.en : brand.zh}</p></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--app-bg)] p-0.5" role="group" aria-label={t(language, 'language')}>{(['zh', 'en'] as Language[]).map((item) => <button key={item} type="button" disabled={disabled} aria-pressed={language === item} onClick={() => update('language', item)} className={`min-h-9 rounded-md px-2.5 text-xs font-medium transition-colors duration-200 lg:min-h-7 ${language === item ? 'bg-[var(--surface-raised)] text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}>{item === 'zh' ? '中' : 'EN'}</button>)}</div>
        <button type="button" onClick={() => onDrawerChange(nextDrawer)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] lg:hidden" aria-expanded={mobileDrawer !== 'collapsed'} aria-label={t(language, mobileDrawer === 'collapsed' ? 'openEditor' : 'closeEditor')}><Icon name={mobileDrawer === 'expanded' ? 'chevronDown' : 'chevronUp'} /></button>
      </div>
    </header>

    <div aria-hidden={mobileDrawer === 'collapsed'} className={`${mobileDrawer === 'collapsed' ? 'pointer-events-none invisible' : ''} flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:visible lg:pointer-events-auto lg:px-5 lg:pb-6`}>
      {!pwa.online && <div className="flex items-start gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-3 py-2.5 text-xs leading-5 text-amber-100"><Icon name="alert" size={16} className="mt-0.5 shrink-0" />{t(language, 'offlineMode')}</div>}
      {(pwa.canInstall || pwa.updateAvailable) && <section className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-3"><div className="min-w-0"><p className="text-sm font-medium text-[var(--text)]">{pwa.updateAvailable ? t(language, 'updateReady') : t(language, 'installApp')}</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{pwa.updateAvailable ? t(language, 'updateHint') : t(language, 'installHint')}</p></div><button type="button" onClick={pwa.updateAvailable ? pwa.applyUpdate : () => void pwa.install()} className="secondary-button !min-h-9 shrink-0 !px-3 !text-xs"><Icon name="download" size={15} />{pwa.updateAvailable ? t(language, 'refresh') : t(language, 'install')}</button></section>}

      <section><label className="section-label" htmlFor="trip-name">{t(language, 'tripName')}</label><input id="trip-name" disabled={disabled} value={trip.name} onChange={(event) => update('name', event.target.value)} className="field-input font-medium" /></section>

      <section>
        <div className="mb-2.5 flex items-center justify-between"><h2 className="text-sm font-medium text-[var(--text)]">{t(language, 'routeAndTransport')}</h2><span className="text-xs tabular-nums text-[var(--text-faint)]">{trip.locations.length} {t(language, 'stops')}</span></div>
        <LocationList locations={trip.locations} legs={trip.legs} language={language} speed={trip.speed} disabled={disabled} onMove={move} onReorder={reorder} onRemove={remove} onLegChange={setLeg} />
        <button type="button" disabled={disabled} onClick={() => setSelectorOpen(true)} className="secondary-button mt-3 w-full border-dashed"><Icon name="add" size={17} />{t(language, 'addLocation').replace(/[＋+]/g, '').trim()}</button>
      </section>

      <section className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5">
        <label><span className="section-label">{t(language, 'animationSpeed')}</span><select disabled={disabled} value={trip.speed} onChange={(event) => setSpeed(event.target.value as Speed)} className="field-input"><option value="fast">{t(language, 'fast')}</option><option value="standard">{t(language, 'standard')}</option><option value="slow">{t(language, 'slow')}</option></select></label>
        <label><span className="section-label">{t(language, 'mapTheme')}</span><select disabled={disabled} value={trip.theme} onChange={(event) => update('theme', event.target.value as MapTheme)} className="field-input"><option value="midnight">Midnight</option><option value="ocean">Ocean</option><option value="minimal">Minimal Light</option></select></label>
      </section>

      <section className="space-y-3 border-t border-[var(--border)] pt-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-medium text-[var(--text)]">{t(language, 'workspaceTools')}</h2><button type="button" disabled={disabled || !canUndo} onClick={onUndo} className="icon-button !h-8 !w-8" title={t(language, 'undo')} aria-label={t(language, 'undo')}><Icon name="undo" size={16} /></button></div>
        <div className="grid grid-cols-[1fr_auto] gap-2"><select disabled={disabled} value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="field-input"><option value="">{t(language, 'chooseTemplate')}</option>{TRIP_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{language === 'zh' ? template.nameZh : template.nameEn}</option>)}</select><button type="button" disabled={disabled || !templateId} onClick={applyTemplate} className="secondary-button !px-3">{t(language, 'applyTemplate')}</button></div>
        <div className="grid grid-cols-2 gap-2"><button type="button" disabled={disabled} onClick={onExportTrip} className="secondary-button !px-2 !text-xs"><Icon name="file" size={15} />{t(language, 'exportTrip')}</button><button type="button" disabled={disabled} onClick={() => fileInputRef.current?.click()} className="secondary-button !px-2 !text-xs"><Icon name="upload" size={15} />{t(language, 'importTrip')}</button></div>
        <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportTrip(file); event.currentTarget.value = '' }} />
      </section>

      <section className="border-t border-[var(--border)] pt-5">
        <div className="mb-3"><span className="section-label">{t(language, 'outputFrame')}</span><div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--app-bg)] p-1">{(['16:9', '9:16', '1:1'] as AspectRatio[]).map((aspect) => <button type="button" key={aspect} disabled={disabled} aria-pressed={trip.aspectRatio === aspect} onClick={() => update('aspectRatio', aspect)} className={`min-h-9 rounded-lg text-xs font-medium transition-colors ${trip.aspectRatio === aspect ? 'bg-[var(--surface-raised)] text-[var(--text)]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}>{aspect}</button>)}</div></div>
        <div className="grid grid-cols-[1fr_44px] gap-2"><button type="button" disabled={disabled} onClick={isPlaying ? onPause : onPlay} className="primary-button"><Icon name={isPlaying ? 'pause' : 'play'} size={17} />{t(language, isPlaying ? 'pause' : 'play')}</button><button type="button" disabled={disabled} onClick={onReplay} className="secondary-button !px-0" title={t(language, 'replay')} aria-label={t(language, 'replay')}><Icon name="replay" size={18} /></button></div>
        <button type="button" disabled={disabled || !exportSupported || trip.locations.length < 2} onClick={onExport} className="secondary-button mt-2 w-full"><Icon name="download" size={17} />{t(language, 'exportVideo')}<span className="ml-auto text-xs text-[var(--text-faint)]">{exportFormat}</span></button>
        <p className="mt-2.5 text-xs leading-5 text-[var(--text-faint)]">{exportSupported ? t(language, 'mobileRecording') : t(language, 'unsupported')}</p>
      </section>
    </div>
    <LocationSelector open={selectorOpen} language={language} disabled={disabled} onClose={() => setSelectorOpen(false)} onSelect={add} />
  </aside>
}
