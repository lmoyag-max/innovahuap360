import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Dot } from '../../components/ui'
import { api } from '../../lib/api'
import { filtros, proyectosPub } from '../../data/public'

interface PortfolioItem {
  id: string
  title: string
  excerpt: string | null
  category: string | null
  imageUrl: string | null
  expectedBenefits: string | null
  linkUrl: string | null
  isFeatured: boolean
  sortOrder: number
}

const CATEGORY_COLOR: Record<string, string> = {
  IA: 'var(--violet-500)',
  'Transformación Digital': 'var(--blue-500)',
  Humanización: 'var(--accent)',
  Gestión: 'var(--amber-500)',
  Clínicos: 'var(--green-500)',
  Investigación: 'var(--slate-500)',
}
const DEFAULT_COLOR = 'var(--slate-500)'

export default function ProyectosPublico() {
  const [active, setActive] = useState('Todos')
  const { data, isLoading, isError } = useQuery<PortfolioItem[]>({
    queryKey: ['public-proyectos'],
    queryFn: async () => (await api.get('/public-content', { params: { section: 'PORTAFOLIO' } })).data,
    retry: 1,
  })

  const useFallback = isError
  const items: PortfolioItem[] = useFallback
    ? proyectosPub.map((p, i) => ({
        id: p.name,
        title: p.name,
        excerpt: p.desc,
        category: p.cat,
        imageUrl: null,
        expectedBenefits: p.impact,
        linkUrl: null,
        isFeatured: i === 0,
        sortOrder: i,
      }))
    : [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const categories = useFallback ? filtros : ['Todos', ...Array.from(new Set(items.map((p) => p.category).filter(Boolean) as string[]))]
  const visible = active === 'Todos' ? items : items.filter((p) => p.category === active)

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="PROYECTOS"
        title="Proyectos de innovación en marcha"
        intro="Explora las iniciativas autorizadas públicamente, organizadas por su ámbito de impacto."
      />

      {/* Filtros — scroll horizontal en móvil */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map((f) => {
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

      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-[13px] text-muted bg-inset border border-line rounded-card px-4 py-3">
          Aún no hay proyectos publicados en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const cc = CATEGORY_COLOR[p.category ?? ''] ?? DEFAULT_COLOR
            return (
              <div
                key={p.id}
                className="bg-card border border-line rounded-card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="h-[120px] w-full object-cover" />
                ) : (
                  <div className="h-[7px]" style={{ background: cc }} />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Dot color={cc} size={8} />
                    <span className="font-mono text-[10px] tracking-wide text-muted">{p.category ?? 'General'}</span>
                    {p.isFeatured && (
                      <span className="ml-auto text-[11px] font-semibold text-muted bg-sunken px-2.5 py-0.5 rounded-full">Destacado</span>
                    )}
                  </div>
                  <h4 className="text-[16.5px] text-ink tracking-tight leading-snug mb-2 font-semibold">{p.title}</h4>
                  {p.excerpt && <p className="text-[13px] text-muted leading-relaxed mb-3">{p.excerpt}</p>}
                  {p.expectedBenefits && (
                    <p className="text-xs font-mono font-semibold mb-3" style={{ color: 'var(--accent)' }}>{p.expectedBenefits}</p>
                  )}
                  {p.linkUrl && (
                    <a href={p.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-semibold pt-3 border-t border-line w-full" style={{ color: 'var(--accent)' }}>
                      Más información <ArrowUpRight size={13} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
