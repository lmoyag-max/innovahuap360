import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader'
import { api } from '../../lib/api'
import { obsFeatured, obsArticles } from '../../data/public'

interface ObservatorioItem {
  id: string
  title: string
  excerpt: string | null
  category: string | null
  isFeatured: boolean
  publishedAt: string | null
}

interface ArticleCard {
  id: string
  title: string
  category: string
  color: string
  dateLabel: string
}

const CATEGORY_COLOR: Record<string, string> = {
  TENDENCIAS: 'var(--blue-500)',
  'CASOS DE ÉXITO': 'var(--green-500)',
  'TRANSFORMACIÓN DIGITAL': 'var(--violet-500)',
  PUBLICACIONES: 'var(--accent)',
}
const DEFAULT_COLOR = 'var(--slate-500)'

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '')
}

export default function Observatorio() {
  const { data, isLoading, isError } = useQuery<ObservatorioItem[]>({
    queryKey: ['public-observatorio'],
    queryFn: async () => (await api.get('/public-content', { params: { section: 'OBSERVATORIO' } })).data,
    retry: 1,
  })

  const useFallback = isError || (!isLoading && (data?.length ?? 0) === 0)
  const items = useFallback ? [] : data ?? []
  const featuredItem = items.find((i) => i.isFeatured) ?? items[0]

  const featured = useFallback
    ? { cat: obsFeatured.cat, title: obsFeatured.title, excerpt: obsFeatured.excerpt, dateLabel: obsFeatured.date }
    : {
        cat: featuredItem?.category ?? '',
        title: featuredItem?.title ?? '',
        excerpt: featuredItem?.excerpt ?? '',
        dateLabel: formatDate(featuredItem?.publishedAt ?? null),
      }

  const articles: ArticleCard[] = useFallback
    ? obsArticles.map((a) => ({ id: a.title, title: a.title, category: a.cat, color: a.color, dateLabel: a.date }))
    : items
        .filter((i) => i.id !== featuredItem?.id)
        .map((i) => ({
          id: i.id,
          title: i.title,
          category: i.category ?? '',
          color: CATEGORY_COLOR[i.category ?? ''] ?? DEFAULT_COLOR,
          dateLabel: formatDate(i.publishedAt),
        }))

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="OBSERVATORIO DE INNOVACIÓN"
        title="Tendencias, evidencia y casos de éxito"
        intro="El radar del HUAP sobre IA en salud, transformación digital y la innovación que está cambiando la atención de urgencia."
      />
      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <div
            className="relative overflow-hidden rounded-2xl min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-7 text-white"
            style={{
              background:
                'linear-gradient(180deg,rgba(17,21,27,.2),rgba(17,21,27,.85)),linear-gradient(135deg,var(--violet-500),var(--accent))',
            }}
          >
            <span className="font-mono text-[10px] tracking-[0.12em] text-white/80 mb-2.5">{featured.cat}</span>
            <h2 className="text-2xl sm:text-[26px] leading-tight tracking-tight max-w-[460px] text-white">{featured.title}</h2>
            <p className="mt-3 text-sm text-white/80 max-w-[480px] leading-relaxed">{featured.excerpt}</p>
            <span className="font-mono text-[11px] text-white/70 mt-3.5">{featured.dateLabel} · Lectura destacada</span>
          </div>
          <div className="flex flex-col gap-3">
            {articles.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-line rounded-[13px] p-[18px] flex-1 flex flex-col justify-center transition-colors hover:border-line-strong"
              >
                <span className="font-mono text-[9.5px] tracking-wide mb-1.5" style={{ color: a.color }}>{a.category}</span>
                <div className="text-[14.5px] font-semibold text-ink leading-snug">{a.title}</div>
                <span className="font-mono text-[11px] text-muted mt-2">{a.dateLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
