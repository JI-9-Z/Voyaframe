import { brand, siteConfig } from '../config/site'

export function ComplianceFooter() {
  return (
    <footer className="flex min-h-7 flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/[.06] bg-[#050d14] px-3 py-1 text-[10px] text-slate-500">
      <span>© {new Date().getFullYear()} {brand.full}</span>
      <a href="#/privacy" target="_blank" rel="noreferrer" className="transition hover:text-slate-300">隐私政策</a>
      <a href="#/terms" target="_blank" rel="noreferrer" className="transition hover:text-slate-300">使用条款</a>
      {siteConfig.icpNumber && (
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="transition hover:text-slate-300">{siteConfig.icpNumber}</a>
      )}
      {siteConfig.publicSecurityNumber && siteConfig.publicSecurityUrl && (
        <a href={siteConfig.publicSecurityUrl} target="_blank" rel="noreferrer" className="transition hover:text-slate-300">{siteConfig.publicSecurityNumber}</a>
      )}
    </footer>
  )
}
