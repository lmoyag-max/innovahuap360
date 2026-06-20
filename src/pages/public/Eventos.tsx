import PageHeader from '../../components/PageHeader'
import { eventos } from '../../data/public'

export default function Eventos() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="EVENTOS Y ACTIVIDADES"
        title="Jornadas, seminarios y convocatorias"
        intro="Participa en la agenda de innovación del HUAP. Abierta a funcionarios, usuarios y colaboradores."
      />
      <div className="flex flex-col gap-3">
        {eventos.map((e) => (
          <div
            key={e.title}
            className="flex items-center gap-4 sm:gap-5 bg-card border border-line rounded-card p-4 sm:px-[22px] sm:py-[18px] transition-colors hover:border-line-strong"
          >
            <div className="w-14 sm:w-16 shrink-0 text-center sm:border-r border-line sm:pr-[18px]">
              <div className="font-mono text-[22px] sm:text-[26px] font-bold leading-none" style={{ color: e.tc }}>
                {e.day}
              </div>
              <div className="font-mono text-[11px] text-muted mt-0.5">{e.mon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] sm:text-base font-bold text-ink leading-snug">{e.title}</div>
              <div className="font-mono text-xs text-muted mt-1">{e.time} · {e.place}</div>
            </div>
            <span
              className="hidden sm:inline-flex shrink-0 text-[11.5px] font-semibold px-3 py-1.5 rounded-full bg-sunken"
              style={{ color: e.tc }}
            >
              {e.type}
            </span>
            <button className="shrink-0 h-[38px] px-3 sm:px-4 rounded-md border border-line bg-card text-ink font-semibold text-[13px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
              Inscribirse
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
