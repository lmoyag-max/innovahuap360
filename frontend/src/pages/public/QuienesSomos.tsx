import PageHeader from '../../components/PageHeader'
import { integrantes, gobernanza } from '../../data/public'

export default function QuienesSomos() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="QUIÉNES SOMOS"
        title="El gobierno de la innovación del HUAP"
        intro="El Comité de Innovación articula, prioriza y acompaña las iniciativas que mejoran la atención de urgencia. Creemos que la innovación pertenece a todos los funcionarios y usuarios del hospital."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { v: '2024', l: 'Año de constitución', d: 'Formalizado por resolución institucional.', c: 'var(--accent)' },
          { v: '12', l: 'Integrantes', d: 'Equipos clínicos, gestión y tecnología.', c: 'var(--blue-500)' },
          { v: '4', l: 'Etapas de gobernanza', d: 'De la idea al impacto medible.', c: 'var(--green-500)' },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-line rounded-card p-6">
            <div className="font-mono text-3xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-sm text-body mt-1.5 font-semibold">{s.l}</div>
            <div className="text-[13px] text-muted mt-0.5">{s.d}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Cómo gobernamos la innovación</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {gobernanza.map((g) => (
          <div key={g.step} className="bg-card border border-line rounded-card p-[22px]">
            <div
              className="font-mono text-[13px] font-bold text-white w-[34px] h-[34px] rounded-[9px] flex items-center justify-center mb-3.5"
              style={{ background: 'var(--accent)' }}
            >
              {g.step}
            </div>
            <div className="text-[15px] font-bold text-ink leading-snug mb-1.5">{g.title}</div>
            <div className="text-[13px] text-muted leading-relaxed">{g.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Integrantes del Comité</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {integrantes.map((m) => (
          <div key={m.name} className="flex items-center gap-3.5 bg-card border border-line rounded-card p-4">
            <span
              className="w-12 h-12 shrink-0 rounded-full text-white flex items-center justify-center font-bold text-[15px] font-mono"
              style={{ background: 'linear-gradient(135deg,var(--accent),#ff6b6b)' }}
            >
              {m.ini}
            </span>
            <div>
              <div className="text-[15px] font-bold text-ink leading-tight">{m.name}</div>
              <div className="text-[13px] text-muted mt-0.5">{m.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
