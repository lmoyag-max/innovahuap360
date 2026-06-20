import type { ReactNode } from 'react'

/** Panel base: superficie de tarjeta con borde y radio del sistema. */
export function Panel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Tag className={`bg-card border border-line rounded-card ${className}`}>{children}</Tag>
  )
}

/** Tarjeta de KPI: número grande mono + etiqueta + tendencia opcional. */
export function Kpi({
  value,
  label,
  trend,
  accentBar,
  icon,
}: {
  value: string
  label: string
  trend?: string
  accentBar?: string
  icon?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-card border border-line rounded-card p-4 sm:p-[18px]">
      {accentBar && (
        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentBar }} />
      )}
      {icon && (
        <div className="mb-2.5" style={{ color: 'var(--accent)' }}>
          {icon}
        </div>
      )}
      <div className="font-mono text-[26px] sm:text-[28px] font-bold tracking-tight text-ink leading-none">
        {value}
      </div>
      <div className="text-[12.5px] text-muted mt-1.5 leading-tight">{label}</div>
      {trend && <div className="font-mono text-[11px] text-green-600 mt-2" style={{ color: 'var(--green-600)' }}>{trend}</div>}
    </div>
  )
}
