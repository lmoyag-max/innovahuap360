import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, Link2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { api } from '../../lib/api'
import { recursos } from '../../data/public'

interface PublicKnowledgeItem {
  id: string
  title: string
  type: string
  fileUrl: string | null
  linkUrl: string | null
  sizeBytes: number | null
  downloads: number
}

function formatSize(bytes: number | null) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDownloads(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k descargas` : `${n} descargas`
}

export default function Conocimiento() {
  const [query, setQuery] = useState('')
  const { data, isLoading, isError } = useQuery<PublicKnowledgeItem[]>({
    queryKey: ['public-knowledge'],
    queryFn: async () => (await api.get('/public/knowledge')).data,
    retry: 1,
  })

  const useFallback = isError
  const items: { id: string; title: string; type: string; meta: string; fileUrl: string | null; linkUrl: string | null }[] = useFallback
    ? recursos.map((r) => ({ id: r.title, title: r.title, type: r.type, meta: r.meta, fileUrl: null, linkUrl: null }))
    : (data ?? []).map((k) => ({
        id: k.id,
        title: k.title,
        type: k.type,
        meta: [formatSize(k.sizeBytes), formatDownloads(k.downloads)].filter(Boolean).join(' · '),
        fileUrl: k.fileUrl,
        linkUrl: k.linkUrl,
      }))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q))
  }, [items, query])

  async function handleOpen(item: { id: string; fileUrl: string | null; linkUrl: string | null }) {
    if (useFallback || (!item.fileUrl && !item.linkUrl)) return
    if (item.linkUrl) {
      window.open(item.linkUrl, '_blank')
      return
    }
    try {
      await api.post(`/public/knowledge/${item.id}/download`)
    } finally {
      window.open(`${api.defaults.baseURL}/public/knowledge/${item.id}/file`, '_blank')
    }
  }

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar publicaciones, casos, guías…"
          className="w-full h-[46px] pl-10 pr-4 rounded-[11px] border border-line bg-card text-body text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>
      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-[13px] text-muted bg-inset border border-line rounded-card px-4 py-3">No se encontraron recursos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => handleOpen(r)}
              disabled={!r.fileUrl && !r.linkUrl}
              className="text-left bg-card border border-line rounded-card p-5 flex gap-3.5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <span
                className="w-11 h-11 shrink-0 rounded-[11px] flex items-center justify-center"
                style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
              >
                {r.linkUrl && !r.fileUrl ? <Link2 size={20} /> : <FileText size={20} />}
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[9.5px] tracking-wide text-muted">{r.type}</span>
                <div className="text-[14.5px] font-semibold text-ink leading-snug my-1.5">{r.title}</div>
                <div className="font-mono text-[10.5px] text-subtle">{r.meta}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
