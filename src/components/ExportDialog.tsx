import { t } from '../lib/i18n'
import type { Language } from '../types'
import { Icon } from './Icon'

interface Props { open: boolean; progress: number; format: string; language: Language; error?: string | null; onCancel: () => void; onClose: () => void }
export function ExportDialog({ open, progress, format, language, error, onCancel, onClose }: Props) {
  if (!open && !error) return null
  const percentage = Math.round(progress * 100)
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="w-full max-w-sm rounded-2xl border border-[var(--border-strong)] bg-[var(--panel)] p-6 text-[var(--text)] shadow-[0_24px_80px_rgba(0,0,0,.5)]">
    {error ? <><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-200/10 text-[var(--danger)]"><Icon name="alert" size={20} /></div><h2 id="export-title" className="text-lg font-semibold">{t(language, 'exportFailed')}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{error}</p><button type="button" onClick={onClose} className="secondary-button mt-5 w-full">{t(language, 'close')}</button></> : <><div className="mb-5 flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--danger)]"><Icon name="record" size={12} />{format}</div><h2 id="export-title" className="text-lg font-semibold">{t(language, 'generating')}</h2></div><span className="text-xl font-medium tabular-nums text-[var(--text-muted)]">{percentage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]"><div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200" style={{ width: `${percentage}%` }} /></div><p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">{t(language, 'keepOpen')}</p><button type="button" onClick={onCancel} className="secondary-button mt-5 w-full">{t(language, 'cancelExport')}</button></>}
  </div></div>
}
