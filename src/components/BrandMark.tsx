interface Props { className?: string; title?: string }

export function BrandMark({ className = 'h-9 w-9', title }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <rect x="3.75" y="3.75" width="24.5" height="24.5" rx="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".42" />
      <path d="M9.25 21.75c2.2-6.15 5.1-1.8 7.35-6.35 1.15-2.35 2.85-3.55 6.15-5.15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9.25" cy="21.75" r="2.1" fill="currentColor" />
      <circle cx="22.75" cy="10.25" r="2.1" fill="currentColor" />
    </svg>
  )
}
