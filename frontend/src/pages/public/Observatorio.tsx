import PageHeader from '../../components/PageHeader'
import { obsFeatured, obsArticles } from '../../data/public'

export default function Observatorio() {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="OBSERVATORIO DE INNOVACIÓN"
        title="Tendencias, evidencia y casos de éxito"
        intro="El radar del HUAP sobre IA en salud, transformación digital y la innovación que está cambiando la atención de urgencia."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div
          className="relative overflow-hidden rounded-2xl min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-7 text-white"
          style={{
            background:
              'linear-gradient(180deg,rgba(17,21,27,.2),rgba(17,21,27,.85)),linear-gradient(135deg,var(--violet-500),var(--accent))',
          }}
        >
          <span className="font-mono text-[10px] tracking-[0.12em] text-white/80 mb-2.5">{obsFeatured.cat}</span>
          <h2 className="text-2xl sm:text-[26px] leading-tight tracking-tight max-w-[460px] text-white">
            {obsFeatured.title}
          </h2>
          <p className="mt-3 text-sm text-white/80 max-w-[480px] leading-relaxed">{obsFeatured.excerpt}</p>
          <span className="font-mono text-[11px] text-white/70 mt-3.5">{obsFeatured.date} · Lectura destacada</span>
        </div>
        <div className="flex flex-col gap-3">
          {obsArticles.map((a) => (
            <div
              key={a.title}
              className="bg-card border border-line rounded-[13px] p-[18px] flex-1 flex flex-col justify-center transition-colors hover:border-line-strong"
            >
              <span className="font-mono text-[9.5px] tracking-wide mb-1.5" style={{ color: a.color }}>{a.cat}</span>
              <div className="text-[14.5px] font-semibold text-ink leading-snug">{a.title}</div>
              <span className="font-mono text-[11px] text-muted mt-2">{a.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
