import type { ReactNode } from 'react'

/** Tooltip simple on-hover (CSS puro, sin JS) para textos cortos sobre cualquier elemento. */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group/tooltip">
      {children}
      <span
        className="pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-white whitespace-nowrap opacity-0 scale-95 transition-all duration-100 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 z-20"
        style={{ background: 'var(--slate-900)' }}
      >
        {label}
      </span>
    </span>
  )
}
