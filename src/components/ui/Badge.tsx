import type { ReactNode } from 'react'

/** Píldora pequeña de estado/etiqueta. */
export function Badge({
  children,
  color = 'var(--accent)',
  bg = 'var(--accent-50)',
  className = '',
}: {
  children: ReactNode
  color?: string
  bg?: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${className}`}
      style={{ color, background: bg }}
    >
      {children}
    </span>
  )
}

/** Punto de color (riesgo, estado, categoría). */
export function Dot({ color, size = 9 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: color }}
    />
  )
}
