import { useEffect, useMemo, useState } from 'react'
import { CITY_DATABASE, createLocation } from '../data/cityDatabase'
import { locationCountry, locationName, t } from '../lib/i18n'
import type { Language, Location } from '../types'
import { Icon } from './Icon'

interface Props { open: boolean; language: Language; onClose: () => void; onSelect: (location: Location) => void; disabled?: boolean }

export function LocationSelector({ open, language, onClose, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const matchingCities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, '')
    const matches = normalizedQuery ? CITY_DATABASE.filter((city) => [city.name, city.nameEn, city.country, city.countryEn, city.province, city.provinceEn, ...(city.aliases ?? [])]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().replace(/\s+/g, '').includes(normalizedQuery))) : CITY_DATABASE
    return matches.slice(0, 120)
  }, [query])
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-[3px] sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="location-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="max-h-[88dvh] w-full max-w-xl overflow-hidden rounded-t-2xl border border-[var(--border-strong)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(0,0,0,.5)] sm:max-h-[82vh] sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 id="location-dialog-title" className="text-base font-semibold text-[var(--text)]">{t(language, 'addDestination')}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{CITY_DATABASE.length.toLocaleString()}{t(language, 'localCities')}</p></div><button type="button" onClick={onClose} className="icon-button" aria-label={t(language, 'close')}><Icon name="close" /></button></div>
      <div className="p-4 sm:px-5"><label className="relative block"><span className="sr-only">{t(language, 'searchPlaceholder')}</span><Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, 'searchPlaceholder')} className="field-input !pl-11" /></label></div>
      <div className="grid max-h-[56dvh] grid-cols-1 gap-2 overflow-y-auto overscroll-contain px-4 pb-5 sm:max-h-[50vh] sm:grid-cols-2 sm:px-5">
        {matchingCities.map((city) => <button key={`${city.name}-${city.country}-${city.latitude}`} type="button" disabled={disabled} onClick={() => { onSelect(createLocation(city)); setQuery(''); onClose() }} className="min-h-[62px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"><span className="block truncate text-sm font-medium text-[var(--text)]">{locationName(city, language)}</span>{language === 'en' && city.nameEn && <span className="mt-0.5 block truncate text-xs text-[var(--text-faint)]">{city.name}</span>}<span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{locationCountry(city, language)}{city.province ? ` · ${language === 'en' ? city.provinceEn || city.province : city.province}` : ''}</span></button>)}
        {!matchingCities.length && <div className="col-span-full flex flex-col items-center py-12 text-center text-sm text-[var(--text-muted)]"><Icon name="search" size={22} className="mb-3 text-[var(--text-faint)]" />{t(language, 'noResults')}</div>}
      </div>
      <p className="border-t border-[var(--border)] px-5 py-3 text-xs leading-5 text-[var(--text-faint)]">{t(language, 'resultLimit')}</p>
    </div>
  </div>
}
