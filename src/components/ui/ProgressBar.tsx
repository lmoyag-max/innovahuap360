/** Barra de progreso horizontal con relleno de color del sistema. */
export function ProgressBar({
  pct,
  color = 'var(--accent)',
  height = 9,
}: {
  pct: number
  color?: string
  height?: number
}) {
  return (
    <div
      className="bg-sunken rounded-full overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
