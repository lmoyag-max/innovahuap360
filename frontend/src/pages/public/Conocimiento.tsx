import { Search, FileText } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { recursos } from '../../data/public'

export default function Conocimiento() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="CENTRO DE CONOCIMIENTO"
        title="Biblioteca pública de innovación"
        intro="Publicaciones, casos de éxito, lecciones aprendidas y documentos descargables, abiertos a toda la comunidad."
      />
      <div className="relative max-w-[520px] mb-7">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          placeholder="Buscar publicaciones, casos, guías…"
          className="w-full h-[46px] pl-10 pr-4 rounded-[11px] border border-line bg-card text-body text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recursos.map((r) => (
          <div
            key={r.title}
            className="bg-card border border-line rounded-card p-5 flex gap-3.5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span
              className="w-11 h-11 shrink-0 rounded-[11px] flex items-center justify-center"
              style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
            >
              <FileText size={20} />
            </span>
            <div className="min-w-0">
              <span className="font-mono text-[9.5px] tracking-wide text-muted">{r.type}</span>
              <div className="text-[14.5px] font-semibold text-ink leading-snug my-1.5">{r.title}</div>
              <div className="font-mono text-[10.5px] text-subtle">{r.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
