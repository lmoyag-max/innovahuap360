import { Eyebrow, ProgressBar } from '../../components/ui'
import { comiteKpis, etapas, riesgos, reuniones, acuerdos, actividad } from '../../data/app'

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between mb-4.5 mb-5 flex-wrap gap-3">
        <div>
          <Eyebrow>MISSION CONTROL</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">
            Centro de operaciones del Comité
          </h1>
        </div>
        <div className="font-mono text-xs text-muted">Actualizado hace 2 min</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {comiteKpis.map((k) => (
          <div key={k.label} className="relative overflow-hidden bg-card border border-line rounded-card p-[18px]">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: k.tone }} />
            <div className="font-mono text-[26px] sm:text-[30px] font-bold tracking-tight text-ink leading-none">{k.value}</div>
            <div className="text-[13px] text-body mt-2 font-semibold">{k.label}</div>
            <div className="text-xs text-muted mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">
        {/* Proyectos por etapa */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-4.5 mb-5 font-bold">Proyectos por etapa</h3>
          <div className="flex flex-col gap-3.5">
            {etapas.map((e) => (
              <div key={e.name} className="flex items-center gap-3">
                <span className="w-[110px] sm:w-[120px] shrink-0 text-[12.5px] text-body">{e.name}</span>
                <div className="flex-1">
                  <ProgressBar pct={e.pct} color={e.color} height={10} />
                </div>
                <span className="w-7 shrink-0 text-right font-mono text-[13px] font-semibold text-ink">{e.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Riesgos críticos */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base text-ink font-bold">Riesgos críticos</h3>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}>
              5 activos
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {riesgos.map((r) => (
              <div key={r.name} className="p-3 rounded-[10px] border border-line" style={{ background: r.bg }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink leading-snug">{r.name}</span>
                  <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: r.tone }}>{r.level}</span>
                </div>
                <div className="text-xs text-muted mt-1">{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Próximas reuniones */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Próximas reuniones</h3>
          <div className="flex flex-col gap-3">
            {reuniones.map((m) => (
              <div key={m.title} className="flex gap-3 items-center">
                <div className="w-[54px] shrink-0 text-center bg-sunken rounded-[9px] py-[7px]">
                  <div className="font-mono text-[13px] font-bold leading-none" style={{ color: 'var(--accent)' }}>{m.date}</div>
                  <div className="font-mono text-[10px] text-muted mt-0.5">{m.time}</div>
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink leading-snug">{m.title}</div>
                  <div className="text-[11px] text-muted">{m.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acuerdos pendientes */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Acuerdos pendientes</h3>
          <div className="flex flex-col gap-2.5">
            {acuerdos.map((a) => (
              <div key={a.txt} className="flex gap-2.5 items-start">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full mt-1" style={{ background: a.light }} />
                <div className="flex-1">
                  <div className="text-[13px] text-ink leading-snug">{a.txt}</div>
                  <div className="text-[11px] text-muted mt-0.5">{a.who} · {a.state}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Actividad reciente</h3>
          <div className="flex flex-col gap-3.5">
            {actividad.map((x, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="w-[26px] h-[26px] shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[10px] font-bold font-mono">
                  {x.ini}
                </span>
                <div className="text-[12.5px] text-body leading-snug">
                  <span className="font-semibold text-ink">{x.who}</span> {x.act}{' '}
                  <span className="font-semibold text-ink">{x.obj}</span>{' '}
                  <span className="text-muted">{x.tail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
