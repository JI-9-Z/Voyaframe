import { useState, type DragEvent } from 'react'
import { locationCountry, locationName, t } from '../lib/i18n'
import type { LabelTiming, Language, Location, RouteStyle, Transport, TripLeg } from '../types'
import { Icon, TRANSPORT_ICON } from './Icon'
import { SEGMENT_DURATION } from '../lib/animationTimeline'
import type { Speed } from '../types'

interface Props {
  locations: Location[]; legs: TripLeg[]; language: Language; speed: Speed; disabled?: boolean
  onRemove: (index: number) => void; onMove: (index: number, direction: -1 | 1) => void
  onReorder: (from: number, to: number) => void; onLegChange: (index: number, patch: Partial<TripLeg>) => void
}
const TRANSPORTS: Transport[] = ['plane', 'car', 'train', 'ship']
const ROUTE_STYLES: RouteStyle[] = ['glow', 'clean', 'dashed']
const LABEL_TIMINGS: LabelTiming[] = ['always', 'arrival']

export function LocationList({ locations, legs, language, speed, disabled, onRemove, onMove, onReorder, onLegChange }: Props) {
  const [expandedLeg, setExpandedLeg] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const startDrag = (event: DragEvent, index: number) => { if (disabled) return; setDraggedIndex(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)) }
  const drop = (event: DragEvent, index: number) => { event.preventDefault(); const from = draggedIndex ?? Number(event.dataTransfer.getData('text/plain')); setDraggedIndex(null); if (Number.isInteger(from) && from !== index) onReorder(from, index) }

  return <div>{locations.map((location, index) => {
    const name = locationName(location, language); const leg = legs[index]; const transport = leg?.transport ?? 'plane'
    return <div key={location.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, index)}>
      <div draggable={!disabled} onDragStart={(event) => startDrag(event, index)} onDragEnd={() => setDraggedIndex(null)} className={`group grid min-h-[64px] grid-cols-[24px_32px_minmax(0,1fr)_auto] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 transition-opacity ${draggedIndex === index ? 'opacity-45' : ''}`}>
        <span className="hidden cursor-grab text-[var(--text-faint)] lg:block" title={t(language, 'dragToReorder')}><Icon name="grip" size={16} /></span>
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] text-xs font-semibold tabular-nums text-[var(--accent)]">{index + 1}{index < locations.length - 1 && <span className="absolute left-1/2 top-full h-7 w-px bg-[var(--border-strong)]" />}</div>
        <div className="min-w-0"><p className="truncate text-sm font-medium text-[var(--text)]">{name}</p><p className="mt-0.5 truncate text-xs text-[var(--text-faint)]">{locationCountry(location, language)}</p></div>
        <div className="flex items-center gap-0.5">
          <button type="button" disabled={disabled || index === 0} onClick={() => onMove(index, -1)} className="icon-button" aria-label={`${t(language, 'moveUp')}${name}`}><Icon name="arrowUp" size={15} /></button>
          <button type="button" disabled={disabled || index === locations.length - 1} onClick={() => onMove(index, 1)} className="icon-button" aria-label={`${t(language, 'moveDown')}${name}`}><Icon name="arrowDown" size={15} /></button>
          <button type="button" disabled={disabled || locations.length <= 2} onClick={() => onRemove(index)} className="icon-button hover:!text-[var(--danger)]" aria-label={`${t(language, 'remove')}${name}`}><Icon name="trash" size={15} /></button>
        </div>
      </div>
      {index < locations.length - 1 && <div className="relative ml-4 border-l border-[var(--border-strong)] py-1.5 pl-3">
        <div className="flex h-9 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-faint)]">{t(language, 'toward')} {locationName(locations[index + 1], language)}</span>
          <label className="flex h-8 w-[112px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--app-bg)] px-2 text-[var(--accent)]"><Icon name={TRANSPORT_ICON[transport]} size={15} /><select disabled={disabled} value={transport} onChange={(event) => onLegChange(index, { transport: event.target.value as Transport })} className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[var(--text-muted)] outline-none">{TRANSPORTS.map((item) => <option key={item} value={item}>{t(language, item)}</option>)}</select></label>
          <button type="button" disabled={disabled} onClick={() => setExpandedLeg(expandedLeg === index ? null : index)} aria-expanded={expandedLeg === index} className={`icon-button !h-8 !w-8 border ${expandedLeg === index ? 'border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text)]' : 'border-transparent'}`} aria-label={t(language, 'legSettings')}><Icon name="settings" size={15} /></button>
        </div>
        {expandedLeg === index && <div className="mb-2 mt-1 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--app-bg)] p-3">
          <NumberField label={t(language, 'duration')} suffix={t(language, 'seconds')} value={leg?.duration ?? SEGMENT_DURATION[speed]} min={1} max={12} step={1} disabled={disabled} onChange={(duration) => onLegChange(index, { duration })} />
          <NumberField label={t(language, 'holdDuration')} suffix={t(language, 'seconds')} value={leg?.holdDuration ?? 1} min={0} max={5} step={.5} disabled={disabled} onChange={(holdDuration) => onLegChange(index, { holdDuration })} />
          <label><span className="section-label !mb-1.5">{t(language, 'routeStyle')}</span><select disabled={disabled} value={leg?.routeStyle ?? 'glow'} onChange={(event) => onLegChange(index, { routeStyle: event.target.value as RouteStyle })} className="field-input !min-h-9 !rounded-lg !px-2 !text-xs">{ROUTE_STYLES.map((value) => <option key={value} value={value}>{t(language, value)}</option>)}</select></label>
          <label><span className="section-label !mb-1.5">{t(language, 'labelTiming')}</span><select disabled={disabled} value={leg?.labelTiming ?? 'always'} onChange={(event) => onLegChange(index, { labelTiming: event.target.value as LabelTiming })} className="field-input !min-h-9 !rounded-lg !px-2 !text-xs">{LABEL_TIMINGS.map((value) => <option key={value} value={value}>{t(language, value)}</option>)}</select></label>
          <label className="col-span-2"><span className="mb-1.5 flex justify-between text-[11px] font-medium text-[var(--text-muted)]"><span>{t(language, 'cameraZoom')}</span><span className="tabular-nums">{(leg?.cameraZoom ?? 1.45).toFixed(2)}×</span></span><input type="range" min={1.05} max={1.9} step={.05} value={leg?.cameraZoom ?? 1.45} disabled={disabled} onChange={(event) => onLegChange(index, { cameraZoom: Number(event.target.value) })} className="timeline-range" /></label>
        </div>}
      </div>}
    </div>
  })}</div>
}

function NumberField({ label, suffix, value, min, max, step, disabled, onChange }: { label: string; suffix: string; value: number; min: number; max: number; step: number; disabled?: boolean; onChange: (value: number) => void }) {
  return <label><span className="section-label !mb-1.5">{label}</span><span className="relative block"><input type="number" value={value} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value))))} className="field-input !min-h-9 !rounded-lg !px-2 !pr-8 !text-xs" /><span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-faint)]">{suffix}</span></span></label>
}
