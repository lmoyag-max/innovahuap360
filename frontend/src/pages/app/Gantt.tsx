import { Eyebrow } from '../../components/ui'
import { ganttMonths, ganttRows } from '../../data/app'

export default function Gantt() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <Eyebrow>CRONOGRAMA</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Carta Gantt · Triage digital con IA
          </h1>
        </div>
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--accent)' }} /> En curso
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--green-500)' }} /> Pendiente
          </span>
        </div>
      </div>

      {/* Scroll horizontal en móvil para no romper el cronograma */}
      <div className="overflow-x-auto">
        <div className="bg-card border border-line rounded-card overflow-hidden min-w-[760px]">
          <div className="flex border-b border-line bg-inset">
            <div className="w-[230px] shrink-0 px-4 py-3 font-mono text-[10px] tracking-[0.1em] text-subtle">HITO / TAREA</div>
            <div className="flex-1 flex">
              {ganttMonths.map((m) => (
                <div key={m} className="flex-1 py-3 text-center font-mono text-[11px] text-muted border-l border-line">
                  {m}
                </div>
              ))}
            </div>
          </div>
          {ganttRows.map((r) => (
            <div key={r.name} className="flex items-center border-b border-line last:border-0">
              <div className="w-[230px] shrink-0 px-4 py-3 flex items-center gap-2.5">
                <span className="w-6 h-6 shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[9px] font-bold font-mono">
                  {r.owner}
                </span>
                <span className="text-[13px] text-ink font-medium leading-tight">{r.name}</span>
              </div>
              <div className="flex-1 relative h-[42px] border-l border-line">
                <div
                  className="absolute top-2.5 h-[22px] rounded-[7px] bg-sunken overflow-hidden border border-line"
                  style={{ left: `${r.off}%`, width: `${r.len}%` }}
                >
                  <div className="h-full rounded-md" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
                {r.pct > 0 && (
                  <span
                    className="absolute top-[15px] font-mono text-[10.5px] font-semibold whitespace-nowrap"
                    style={{ left: `calc(${r.off + r.len}% + 8px)`, color: r.color }}
                  >
                    {r.pct}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
