import type { ReactNode } from 'react'

/** Etiqueta superior en versalitas monoespaciadas (motivo Acervo). */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`font-mono text-[11px] tracking-[0.14em] ${className}`}
      style={{ color: 'var(--accent)' }}
    >
      {children}
    </span>
  )
}

/** Encabezado de sección con eyebrow opcional. */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="text-xl sm:text-2xl text-ink tracking-tight mt-1.5 font-bold">{title}</h2>
        {subtitle && <p className="text-muted text-sm mt-1 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
