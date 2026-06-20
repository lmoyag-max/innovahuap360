import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { Dot } from '../../components/ui'
import { filtros, proyectosPub } from '../../data/public'

export default function PortafolioPublico() {
  const [active, setActive] = useState('Todos')
  const visible = active === 'Todos' ? proyectosPub : proyectosPub.filter((p) => p.cat === active)

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="PORTAFOLIO PÚBLICO"
        title="Proyectos de innovación en marcha"
        intro="Explora las iniciativas autorizadas públicamente, organizadas por su ámbito de impacto."
      />

      {/* Filtros — scroll horizontal en móvil */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {filtros.map((f) => {
          const on = f === active
          return (
            <button
              key={f}
              onClick={() => setActive(f)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 border transition-colors"
              style={
                on
                  ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                  : { background: 'var(--surface-card)', color: 'var(--text-body)', borderColor: 'var(--border)' }
              }
            >
              {f}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((p) => (
          <div
            key={p.name}
            className="bg-card border border-line rounded-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="h-[7px]" style={{ background: p.cc }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Dot color={p.cc} size={8} />
                <span className="font-mono text-[10px] tracking-wide text-muted">{p.cat}</span>
                <span className="ml-auto text-[11px] font-semibold text-muted bg-sunken px-2.5 py-0.5 rounded-full">
                  {p.stage}
                </span>
              </div>
              <h4 className="text-[16.5px] text-ink tracking-tight leading-snug mb-2 font-semibold">{p.name}</h4>
              <p className="text-[13px] text-muted leading-relaxed mb-4">{p.desc}</p>
              <div className="flex items-center justify-between pt-3.5 border-t border-line">
                <span className="text-xs text-muted">{p.owner}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>{p.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
