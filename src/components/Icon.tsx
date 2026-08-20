import type { ReactNode, SVGProps } from 'react'

export type IconName = 'add' | 'alert' | 'arrowDown' | 'arrowUp' | 'car' | 'chevronDown' | 'chevronUp' | 'close' | 'download' | 'expand' | 'file' | 'grip' | 'pause' | 'plane' | 'play' | 'record' | 'replay' | 'reset' | 'search' | 'settings' | 'ship' | 'train' | 'trash' | 'undo' | 'upload' | 'zoomIn' | 'zoomOut'

interface Props extends SVGProps<SVGSVGElement> { name: IconName; size?: number }

export function Icon({ name, size = 18, ...props }: Props) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<IconName, ReactNode> = {
    add: <><path d="M12 5v14M5 12h14" /></>,
    alert: <><path d="M10.3 4.4 3.1 17a2 2 0 0 0 1.7 3h14.4a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    arrowDown: <><path d="M12 5v14M7 14l5 5 5-5" /></>,
    arrowUp: <><path d="M12 19V5M7 10l5-5 5 5" /></>,
    car: <><path d="m5 16 1.5-6h11l1.5 6M4 16h16v3H4z" /><circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
    chevronDown: <path d="m7 9.5 5 5 5-5" />,
    chevronUp: <path d="m7 14.5 5-5 5 5" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></>,
    expand: <><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    grip: <><circle cx="9" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="7" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="17" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="17" r="1" fill="currentColor" stroke="none" /></>,
    pause: <><path d="M9 5v14M15 5v14" /></>,
    plane: <path d="m3 13 7-2 4-7 2 .5-2 6 6-1.5 1 2-7 3-1 6-2-.5.5-7-1.5-2 3-1.5-1 1.5-4-1Z" />,
    play: <path d="m8 5 11 7-11 7Z" />,
    record: <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />,
    replay: <><path d="M20 8v5h-5" /><path d="M19 13a7 7 0 1 1-1.8-6.7L20 8" /></>,
    reset: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" /><path d="M4 4v4.6h4.6" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    ship: <><path d="m4 15 8-4 8 4-2 4H6z" /><path d="M9 11V6h6v5M4 21c2 1 4 1 6 0 2 1 4 1 6 0 2 1 3 1 4 0" /></>,
    train: <><rect x="6" y="3" width="12" height="15" rx="3" /><path d="M8.5 8h7M9 21l3-3 3 3M9 14h.01M15 14h.01" /></>,
    trash: <><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 14h8l1-14" /></>,
    undo: <><path d="M9 7 4 12l5 5" /><path d="M5 12h8a6 6 0 0 1 6 6" /></>,
    upload: <><path d="M12 21V9M7 14l5-5 5 5M4 4h16" /></>,
    zoomIn: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4M10.5 7.5v6M7.5 10.5h6" /></>,
    zoomOut: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4M7.5 10.5h6" /></>,
  }
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...common} {...props}>{paths[name]}</svg>
}

export const TRANSPORT_ICON: Record<'plane' | 'car' | 'train' | 'ship', IconName> = { plane: 'plane', car: 'car', train: 'train', ship: 'ship' }
