import { Eyebrow, ProgressBar } from '../../components/ui'
import { ejecKpis, ejecImpacto, ejecLineas } from '../../data/app'

export default function Ejecutivo() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4.5 mb-[18px]">
        <div>
          <Eyebrow>VISTA DIRECCIÓN</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">
            Dashboard Ejecutivo
          </h1>
        </div>
        <span className="font-mono text-xs text-muted">Periodo 2026 · Q2</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {ejecKpis.map((k) => (
          <div
            key={k.l}
            className="relative overflow-hidden border border-line rounded-card p-5"
            style={{ background: 'linear-gradient(180deg,var(--surface-card),var(--surface-inset))' }}
          >
            <div className="absolute -right-2.5 -top-2.5 w-[60px] h-[60px] rounded-full opacity-10" style={{ background: k.tone }} />
            <div className="font-mono text-[26px] sm:text-[30px] font-bold text-ink leading-none">{k.v}</div>
            <div className="text-[13px] text-body mt-2 font-semibold">{k.l}</div>
            <div className="text-xs text-muted mt-0.5">{k.s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Impacto por ámbito — barras */}
        <div className="bg-card border border-line rounded-card p-5 sm:p-6">
          <h3 className="text-base text-ink mb-5.5 mb-6 font-bold">Impacto por ámbito</h3>
          <div className="flex items-end justify-around gap-3.5 h-[200px] px-2">
            {ejecImpacto.map((b) => (
              <div key={b.l} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                <span className="font-mono text-[13px] font-bold text-ink">{b.pct}</span>
                <div className="w-full max-w-[46px] rounded-t-lg" style={{ height: `${b.pct}%`, background: b.color }} />
                <span className="text-[11.5px] text-muted text-center">{b.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores estratégicos */}
        <div className="bg-card border border-line rounded-card p-5 sm:p-6">
          <h3 className="text-base text-ink mb-5 font-bold">Indicadores estratégicos</h3>
          <div className="flex flex-col gap-4.5 gap-5">
            {ejecLineas.map((l) => (
              <div key={l.l}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13.5px] text-body font-medium">{l.l}</span>
                  <span className="text-xs font-semibold" style={{ color: l.color }}>{l.v}</span>
                </div>
                <ProgressBar pct={l.pct} color={l.color} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
