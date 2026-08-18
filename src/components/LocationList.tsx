import { locationCountry, locationName, t } from '../lib/i18n'
import type { Language, Location, Transport, TripLeg } from '../types'

interface Props { locations: Location[]; legs: TripLeg[]; language: Language; disabled?: boolean; onRemove: (index: number) => void; onMove: (index: number, direction: -1 | 1) => void; onTransportChange: (index: number, transport: Transport) => void }
const ICONS: Record<Transport, string> = { plane: '✈', car: '◆', train: '▰', ship: '◒' }

export function LocationList({ locations, legs, language, disabled, onRemove, onMove, onTransportChange }: Props) {
  const transportLabel = (transport: Transport) => `${ICONS[transport]} ${t(language, transport)}`
  return <div>{locations.map((location, index) => {
    const name = locationName(location, language)
    return <div key={location.id}>
      <div className="group grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.035] p-2.5">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-[11px] font-bold text-cyan-200">{index + 1}{index < locations.length - 1 && <span className="absolute left-1/2 top-full h-4 w-px bg-gradient-to-b from-cyan-400/40 to-transparent" />}</div>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{name}</p><p className="truncate text-[10px] text-slate-500">{locationCountry(location, language)} · {location.longitude.toFixed(2)}, {location.latitude.toFixed(2)}</p></div>
        <div className="flex items-center gap-0.5">
          <button type="button" disabled={disabled || index === 0} onClick={() => onMove(index, -1)} className="icon-button" aria-label={`${t(language, 'moveUp')}${name}`}>↑</button>
          <button type="button" disabled={disabled || index === locations.length - 1} onClick={() => onMove(index, 1)} className="icon-button" aria-label={`${t(language, 'moveDown')}${name}`}>↓</button>
          <button type="button" disabled={disabled || locations.length <= 2} onClick={() => onRemove(index)} className="icon-button hover:!text-rose-300" aria-label={`${t(language, 'remove')}${name}`}>×</button>
        </div>
      </div>
      {index < locations.length - 1 && <div className="relative flex h-9 items-center gap-2 pl-3.5">
        <span className="h-full w-px bg-gradient-to-b from-cyan-400/40 to-violet-400/30" />
        <span className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-600">{t(language, 'toward')} {locationName(locations[index + 1], language)}</span>
        <select aria-label={`${t(language, 'toward')} ${locationName(locations[index + 1], language)}`} disabled={disabled} value={legs[index]?.transport ?? 'plane'} onChange={(event) => onTransportChange(index, event.target.value as Transport)} className="ml-auto rounded-lg border border-white/[.08] bg-[#0d1923] px-2 py-1 text-[10px] font-semibold text-cyan-100 outline-none focus:border-cyan-300/40">
          {(Object.keys(ICONS) as Transport[]).map((transport) => <option key={transport} value={transport}>{transportLabel(transport)}</option>)}
        </select>
      </div>}
    </div>
  })}</div>
}
