import { useQuery } from '@tanstack/react-query'
import { FileText, Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { api } from '../../lib/api'
import { politicaDocs } from '../../data/public'

interface PoliticaItem {
  id: string
  title: string
  excerpt: string | null
  category: string | null
  documentUrl: string | null
}
interface PoliticaResponse {
  published: boolean
  content: { title: string; excerpt: string | null; body: string | null; imageUrl: string | null } | null
  items: PoliticaItem[]
}

const FALLBACK_TITLE = 'Política de Innovación'
const FALLBACK_INTRO =
  'Biblioteca digital con la política, reglamentos, resoluciones y planes que rigen la innovación en el HUAP. Documentos abiertos a toda la comunidad.'

export default function Politica() {
  const { data, isLoading, isError } = useQuery<PoliticaResponse>({
    queryKey: ['public-politica'],
    queryFn: async () => (await api.get('/public/politica')).data,
    retry: 1,
  })

  const useFallback = isError
  const title = useFallback ? FALLBACK_TITLE : data?.content?.title ?? FALLBACK_TITLE
  const intro = useFallback ? FALLBACK_INTRO : data?.content?.excerpt ?? FALLBACK_INTRO
  const body = useFallback ? null : data?.content?.body
  const docs: { id: string; title: string; category: string | null; excerpt: string | null; documentUrl: string | null }[] = useFallback
    ? politicaDocs.map((d) => ({ id: d.title, title: d.title, category: d.type, excerpt: `${d.date} · ${d.size}`, documentUrl: null }))
    : data?.items ?? []

  const showDraftNotice = !isLoading && !isError && data && !data.published

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader eyebrow="MARCO INSTITUCIONAL" title={title} intro={intro} />

      {showDraftNotice && (
        <p className="mb-6 text-[13px] text-muted bg-inset border border-line rounded-card px-4 py-3">
          El contenido de esta página está siendo actualizado por el Comité.
        </p>
      )}

      {body && <p className="text-[14.5px] text-body leading-relaxed whitespace-pre-line mb-8">{body}</p>}

      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <div
              key={d.id}
              className="bg-card border border-line rounded-card p-[22px] flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="w-[42px] h-[42px] rounded-[11px] bg-sunken flex items-center justify-center" style={{ color: 'var(--accent)' }}>
                  <FileText size={20} />
                </span>
                {d.category && (
                  <span className="font-mono text-[9.5px] tracking-wider border border-line px-2 py-0.5 rounded-full" style={{ color: 'var(--accent)' }}>
                    {d.category}
                  </span>
                )}
              </div>
              <div className="text-[15.5px] font-bold text-ink leading-snug mb-auto">{d.title}</div>
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-line">
                <span className="font-mono text-[11px] text-muted">{d.excerpt}</span>
                {d.documentUrl ? (
                  <a
                    href={`${api.defaults.baseURL}${d.documentUrl}`}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Download size={14} /> Descargar
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-subtle">
                    <Download size={14} /> Próximamente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
