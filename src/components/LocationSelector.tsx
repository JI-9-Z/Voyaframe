import { useMemo, useState } from 'react'
import { CITY_DATABASE, createLocation } from '../data/cityDatabase'
import { locationCountry, locationName, t } from '../lib/i18n'
import type { Language, Location } from '../types'

interface Props { open: boolean; language: Language; onClose: () => void; onSelect: (location: Location) => void; disabled?: boolean }

export function LocationSelector({ open, language, onClose, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const matchingCities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, '')
    const matches = normalizedQuery ? CITY_DATABASE.filter((city) => [city.name, city.nameEn, city.country, city.countryEn, city.province, city.provinceEn, ...(city.aliases ?? [])]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().replace(/\s+/g, '').includes(normalizedQuery))) : CITY_DATABASE
    return matches.slice(0, 120)
  }, [query])
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={t(language, 'addDestination')} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="max-h-[78vh] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0d1822] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 className="text-lg font-bold">{t(language, 'addDestination')}</h2><p className="mt-1 text-xs text-slate-400">{CITY_DATABASE.length.toLocaleString()}{t(language, 'localCities')}</p></div><button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={t(language, 'close')}>✕</button></div>
      <div className="p-4"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, 'searchPlaceholder')} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/60" /></div>
      <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto px-4 pb-5 sm:grid-cols-3">
        {matchingCities.map((city) => <button key={`${city.name}-${city.country}-${city.latitude}`} type="button" disabled={disabled} onClick={() => { onSelect(createLocation(city)); setQuery(''); onClose() }} className="rounded-xl border border-white/8 bg-white/[.035] p-3 text-left hover:border-cyan-300/30 hover:bg-cyan-300/[.07]"><span className="block truncate text-sm font-semibold">{locationName(city, language)}</span>{language === 'en' && city.nameEn && <span className="mt-0.5 block truncate text-[10px] text-slate-500">{city.name}</span>}<span className="mt-1 block truncate text-[11px] text-slate-500">{locationCountry(city, language)}{city.province ? ` · ${language === 'en' ? city.provinceEn || city.province : city.province}` : ''}</span></button>)}
        {!matchingCities.length && <p className="col-span-full py-10 text-center text-sm text-slate-500">{t(language, 'noResults')}</p>}
      </div>
      <p className="border-t border-white/[.06] px-5 py-3 text-[10px] text-slate-600">{t(language, 'resultLimit')}</p>
    </div>
  </div>
}
