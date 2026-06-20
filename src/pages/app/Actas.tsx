import { useState } from 'react'
import { Plus } from 'lucide-react'
import { actas, actaParticipantes, actaAcuerdos, actaCompromisos } from '../../data/app'

export default function Actas() {
  const [sel, setSel] = useState(0)

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4.5 gap-5 items-start animate-viewin">
      {/* Lista de actas */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h1 className="text-xl text-ink tracking-tight font-extrabold">Actas</h1>
          <button
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-white font-semibold text-[12.5px]"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={14} /> Nueva
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {actas.map((a, i) => {
            const on = i === sel
            return (
              <button
                key={a.title}
                onClick={() => setSel(i)}
                className="flex flex-col gap-1 p-3.5 rounded-[11px] text-left border transition-colors"
                style={
                  on
                    ? { background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }
                    : { background: 'var(--surface-card)', borderColor: 'var(--border)' }
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] text-muted">{a.date}</span>
                  <span
                    className="font-mono text-[10px] px-[7px] rounded-full"
                    style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}
                  >
                    {a.open > 0 ? `${a.open} abiertos` : 'al día'}
                  </span>
                </div>
                <div className="text-sm font-bold text-ink">{a.title}</div>
                <div className="text-xs text-muted">{a.n}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle de acta */}
      <div className="bg-card border border-line rounded-card p-5 sm:p-[26px]">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>11 JUN 2026 · 09:00</span>
            <h2 className="mt-1.5 text-[20px] sm:text-[23px] text-ink tracking-tight font-bold">{actas[sel].title}</h2>
          </div>
          <button className="h-[34px] px-3.5 rounded-md border border-line bg-card text-ink font-semibold text-[12.5px]">
            Exportar PDF
          </button>
        </div>

        <div className="flex items-center gap-2.5 my-5 sm:my-6 flex-wrap">
          <span className="font-mono text-[10px] tracking-wider text-subtle">PARTICIPANTES</span>
          <div className="flex">
            {actaParticipantes.map((ini, i) => (
              <span
                key={i}
                className="w-[30px] h-[30px] rounded-full bg-sunken border-2 border-card text-body flex items-center justify-center text-[10px] font-bold font-mono"
                style={{ marginLeft: i === 0 ? 0 : -7 }}
              >
                {ini}
              </span>
            ))}
          </div>
        </div>

        <h3 className="text-[15px] text-ink mb-3 font-bold">Acuerdos y seguimiento</h3>
        <div className="flex flex-col gap-2.5 mb-6">
          {actaAcuerdos.map((a) => (
            <div key={a.txt} className="flex items-center gap-3 p-3 sm:px-[15px] rounded-[11px] bg-inset border border-line">
              <span className="w-[11px] h-[11px] shrink-0 rounded-full" style={{ background: a.light }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-ink font-medium leading-snug">{a.txt}</div>
                <div className="text-[11.5px] text-muted mt-0.5">{a.resp} · vence {a.due}</div>
              </div>
              <span className="shrink-0 text-[11px] font-semibold font-mono" style={{ color: a.light }}>{a.state}</span>
            </div>
          ))}
        </div>

        <h3 className="text-[15px] text-ink mb-3 font-bold">Compromisos</h3>
        <div className="flex flex-col gap-2">
          {actaCompromisos.map((c) => (
            <div key={c.txt} className="flex items-center gap-2.5 text-[13px] text-body">
              <span className="w-[18px] h-[18px] shrink-0 rounded-[5px] border-[1.5px] border-line-strong" />
              {c.txt} <span className="text-muted">· {c.resp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
