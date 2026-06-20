import { Eyebrow, ProgressBar } from '../../components/ui'
import { factSteps, factCriterios, factTotal } from '../../data/app'

export default function Factibilidad() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ASISTENTE DE EVALUACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-1 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
        Ficha de factibilidad guiada
      </h1>
      <p className="text-muted text-sm mb-5.5 mb-6">Triage digital asistido por IA · evaluación paso a paso</p>

      {/* Pasos — scroll horizontal en móvil */}
      <div className="flex items-center gap-0 mb-6 max-w-[640px] overflow-x-auto pb-1">
        {factSteps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 min-w-[120px]">
            <span
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-mono text-xs font-bold"
              style={s.on ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
            >
              {s.n}
            </span>
            <span className="text-[12.5px] font-semibold ml-2 whitespace-nowrap" style={{ color: s.on ? 'var(--text-strong)' : 'var(--text-muted)' }}>
              {s.l}
            </span>
            {i < factSteps.length - 1 && <span className="h-0.5 flex-1 mx-2.5 bg-line" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4.5 gap-5 items-start">
        {/* Indicadores */}
        <div className="bg-card border border-line rounded-card p-5 sm:p-6">
          <h3 className="text-base text-ink mb-5 font-bold">Indicadores de evaluación</h3>
          <div className="flex flex-col gap-4.5 gap-5">
            {factCriterios.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13.5px] text-body font-medium">{c.name}</span>
                  <span className="font-mono text-[13px] font-bold" style={{ color: c.color }}>
                    {c.score}
                    <span className="text-subtle font-normal">/100</span>
                  </span>
                </div>
                <ProgressBar pct={c.score} color={c.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Puntaje global */}
        <div className="bg-card border border-line rounded-card p-6 sm:p-7 text-center">
          <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-4.5 mb-5">PUNTAJE GLOBAL</div>
          <div
            className="w-[140px] h-[140px] rounded-full mx-auto flex items-center justify-center relative"
            style={{ background: `conic-gradient(var(--accent) 0 ${factTotal}%, var(--surface-sunken) ${factTotal}% 100%)` }}
          >
            <div className="w-[108px] h-[108px] rounded-full bg-card flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-bold text-ink leading-none">{factTotal}</span>
              <span className="text-[11px] text-muted">de 100</span>
            </div>
          </div>
          <div className="mt-5 p-3 rounded-[11px]" style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)' }}>
            <div className="text-sm font-bold" style={{ color: 'var(--green-600)' }}>Factible — recomendado a piloto</div>
            <div className="text-xs text-muted mt-0.5">Impacto y humanización destacados</div>
          </div>
          <button className="w-full mt-3.5 h-11 rounded-[10px] text-white font-bold text-sm" style={{ background: 'var(--accent)' }}>
            Enviar al Comité
          </button>
        </div>
      </div>
    </div>
  )
}
