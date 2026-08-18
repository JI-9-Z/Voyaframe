import { t } from '../lib/i18n'
import type { Language } from '../types'

interface Props { open: boolean; progress: number; format: string; language: Language; error?: string | null; onCancel: () => void; onClose: () => void }
export function ExportDialog({ open, progress, format, language, error, onCancel, onClose }: Props) {
  if (!open && !error) return null
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1822] p-6 text-white shadow-2xl">
    {error ? <><div className="mb-4 text-3xl">⚠</div><h2 className="text-lg font-bold">{t(language, 'exportFailed')}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{error}</p><button type="button" onClick={onClose} className="secondary-button mt-5 w-full">{t(language, 'close')}</button></> : <><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-rose-300">Recording · {format}</p><h2 className="mt-1 text-lg font-bold">{t(language, 'generating')}</h2></div><span className="animate-pulse text-2xl text-rose-400">●</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="mt-3 text-center text-xs tabular-nums text-slate-400">{Math.round(progress * 100)}%</p><p className="mt-4 text-xs leading-5 text-slate-500">{t(language, 'keepOpen')}</p><button type="button" onClick={onCancel} className="secondary-button mt-5 w-full">{t(language, 'cancelExport')}</button></>}
  </div></div>
}
