import { Eyebrow } from '../../components/ui'
import { comMetrics, comCalendar, comCampanas } from '../../data/app'

export default function Comunicaciones() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>PLAN COMUNICACIONAL 2026–2027</Eyebrow>
      <h1 className="mt-1.5 mb-5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
        Comunicaciones · Posta Innova
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4.5 mb-5">
        {comMetrics.map((m) => (
          <div key={m.l} className="bg-card border border-line rounded-card p-4.5 p-[18px]">
            <div className="font-mono text-[24px] sm:text-[26px] font-bold text-ink leading-none">{m.v}</div>
            <div className="text-[13px] text-body mt-1.5 font-semibold">{m.l}</div>
            <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--green-600)' }}>{m.s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        {/* Calendario editorial */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-4 font-bold">Calendario editorial</h3>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {comCalendar.map((d) => (
              <div key={d.day} className="flex-1 min-w-[130px]">
                <div className="font-mono text-[11px] text-muted text-center pb-2.5 border-b border-line mb-2.5">
                  {d.day}
                </div>
                <div className="flex flex-col gap-2">
                  {d.items.map((it) => (
                    <div
                      key={it.t}
                      className="text-xs text-ink bg-inset rounded-[7px] px-2.5 py-2.5 leading-tight"
                      style={{ borderLeft: `3px solid ${it.c}` }}
                    >
                      {it.t}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campañas */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Campañas</h3>
          <div className="flex flex-col gap-3">
            {comCampanas.map((c) => (
              <div key={c.name} className="p-3.5 rounded-[11px] border border-line">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13.5px] font-semibold text-ink leading-snug">{c.name}</span>
                  <span
                    className="shrink-0 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: c.tone, background: c.bg }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted">{c.ch}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
