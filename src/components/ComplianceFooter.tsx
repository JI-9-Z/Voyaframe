import { brand, siteConfig } from '../config/site'

export function ComplianceFooter() {
  return (
    <footer className="flex min-h-8 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[var(--border)] bg-[var(--app-bg)] px-3 py-1.5 text-[11px] text-[var(--text-faint)]">
      <span>© {new Date().getFullYear()} {brand.full}</span>
      <a href="#/privacy" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text-muted)]">隐私政策</a>
      <a href="#/terms" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text-muted)]">使用条款</a>
      {siteConfig.icpNumber && (
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text-muted)]">{siteConfig.icpNumber}</a>
      )}
      {siteConfig.publicSecurityNumber && siteConfig.publicSecurityUrl && (
        <a href={siteConfig.publicSecurityUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--text-muted)]">{siteConfig.publicSecurityNumber}</a>
      )}
    </footer>
  )
}
