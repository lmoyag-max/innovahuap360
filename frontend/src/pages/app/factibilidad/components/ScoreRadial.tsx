/** Indicador circular del puntaje global de una ficha (conic-gradient, sin librería de charts). */
export function ScoreRadial({ score, size = 140 }: { score: number | null; size?: number }) {
  const pct = score ?? 0
  const innerSize = Math.round(size * 0.77)
  return (
    <div
      className="rounded-full mx-auto flex items-center justify-center relative"
      style={{ width: size, height: size, background: `conic-gradient(var(--accent) 0 ${pct}%, var(--surface-sunken) ${pct}% 100%)` }}
    >
      <div className="rounded-full bg-card flex flex-col items-center justify-center" style={{ width: innerSize, height: innerSize }}>
        <span className="font-mono text-4xl font-bold text-ink leading-none">{score ?? '—'}</span>
        <span className="text-[11px] text-muted">de 100</span>
      </div>
    </div>
  )
}
