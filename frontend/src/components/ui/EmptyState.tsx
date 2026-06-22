import type { ReactNode } from 'react'

/** Estado vacío atractivo: ícono en círculo, mensaje, descripción y acción opcional. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="bg-card border border-line rounded-card p-10 sm:p-14 text-center flex flex-col items-center">
      <span
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
      >
        {icon}
      </span>
      <h3 className="text-[16px] font-bold text-ink mb-1.5 max-w-[420px]">{title}</h3>
      {description && <p className="text-[13px] text-muted max-w-[420px] mb-5">{description}</p>}
      {action}
    </div>
  )
}
