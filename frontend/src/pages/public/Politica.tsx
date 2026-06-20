import { FileText, Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { politicaDocs } from '../../data/public'

export default function Politica() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="MARCO INSTITUCIONAL"
        title="Política de Innovación"
        intro="Biblioteca digital con la política, reglamentos, resoluciones y planes que rigen la innovación en el HUAP. Documentos abiertos a toda la comunidad."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {politicaDocs.map((d) => (
          <div
            key={d.title}
            className="bg-card border border-line rounded-card p-[22px] flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="w-[42px] h-[42px] rounded-[11px] bg-sunken flex items-center justify-center" style={{ color: d.color }}>
                <FileText size={20} />
              </span>
              <span className="font-mono text-[9.5px] tracking-wider border border-line px-2 py-0.5 rounded-full" style={{ color: d.color }}>
                {d.type}
              </span>
            </div>
            <div className="text-[15.5px] font-bold text-ink leading-snug mb-auto">{d.title}</div>
            <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line">
              <span className="font-mono text-[11px] text-muted">{d.date} · {d.size}</span>
              <button className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
                <Download size={14} /> Descargar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
