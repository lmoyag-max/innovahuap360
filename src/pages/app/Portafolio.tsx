import { Plus } from 'lucide-react'
import { Eyebrow, Dot } from '../../components/ui'
import { kanban } from '../../data/app'

export default function Portafolio() {
  return (
    <div className="animate-viewin h-full flex flex-col">
      <div className="shrink-0 p-4 sm:px-6 sm:pt-[22px] sm:pb-3.5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <Eyebrow>PORTAFOLIO</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Tablero Kanban de proyectos
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="text-[12.5px] text-muted bg-card border border-line px-3 py-2 rounded-md">36 proyectos</span>
          <button
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[13px]"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={15} /> Nuevo
          </button>
        </div>
      </div>

      {/* Tablero con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-6 min-h-0">
        <div className="flex gap-3.5 h-full items-start w-max">
          {kanban.map((col) => (
            <div key={col.stage} className="w-[264px] shrink-0 flex flex-col max-h-full">
              <div className="flex items-center gap-2 px-1 pb-3">
                <Dot color={col.color} />
                <span className="font-bold text-[13px] text-ink">{col.stage}</span>
                <span className="font-mono text-[11px] text-muted bg-sunken px-[7px] rounded-full ml-auto">
                  {col.cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 overflow-y-auto p-0.5">
                {col.cards.map((c) => (
                  <div
                    key={c.name}
                    className="bg-card border border-line rounded-xl p-3.5 shadow-card cursor-grab transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Dot color={c.rt} size={7} />
                      <span className="font-mono text-[10px] text-muted">Riesgo {c.risk}</span>
                    </div>
                    <div className="text-[13.5px] font-semibold text-ink leading-snug mb-2.5">{c.name}</div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="w-[22px] h-[22px] rounded-full bg-sunken text-muted flex items-center justify-center text-[9px] font-bold font-mono">
                        {c.ini}
                      </span>
                      <span className="text-[11.5px] text-muted">{c.owner} · {c.sponsor}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-line">
                      <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>{c.kpi}</span>
                      <span className="font-mono text-[10.5px] text-subtle">{c.due}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
