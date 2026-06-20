import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Download, FolderOpen, Plus, X } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage, downloadUpload } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

const TYPES = ['ACTA', 'INFORME', 'PRESENTACION', 'RESOLUCION', 'CONVENIO', 'LECCION', 'GUIA', 'PUBLICACION'] as const

interface KnowledgeItem {
  id: string
  title: string
  type: string
  folder: string | null
  fileUrl: string | null
  authorName: string | null
  createdAt: string
}

export default function ConocimientoInterno() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('knowledge.manage')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const { data: items, isLoading } = useQuery<KnowledgeItem[]>({
    queryKey: ['knowledge'],
    queryFn: async () => (await api.get('/knowledge')).data,
  })

  const folders = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items ?? []) {
      const key = item.folder || 'Sin carpeta'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }))
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = items ?? []
    return q ? list.filter((i) => i.title.toLowerCase().includes(q)) : list
  }, [items, search])

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; type: string; folder: string }) => {
      let fileUrl: string | undefined
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const upload = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        fileUrl = upload.data.id
      }
      return api.post('/knowledge', { ...data, fileUrl })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      setShowForm(false)
      setFile(null)
    },
  })

  const handleDownload = async (item: KnowledgeItem) => {
    if (!item.fileUrl) return
    await downloadUpload(item.fileUrl, item.title).catch(() => alert('No se pudo descargar el archivo'))
  }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <Eyebrow>REPOSITORIO INTERNO</Eyebrow>
          <h1 className="mt-1.5 mb-1 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Conocimiento del Comité
          </h1>
        </div>
        {canManage && (
          <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[13px]" style={{ background: 'var(--accent)' }}>
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Cerrar' : 'Subir documento'}
          </button>
        )}
      </div>

      <div className="relative max-w-[480px] my-4.5 my-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar actas, informes, resoluciones…"
          className="w-full h-[42px] pl-9 pr-3.5 rounded-[10px] border border-line bg-card text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>

      {showForm && (
        <form
          className="bg-card border border-line rounded-card p-4 mb-5 grid grid-cols-1 sm:grid-cols-4 gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const title = (form.elements.namedItem('title') as HTMLInputElement).value
            const type = (form.elements.namedItem('type') as HTMLSelectElement).value
            const folder = (form.elements.namedItem('folder') as HTMLInputElement).value
            if (title) createMutation.mutate({ title, type, folder })
          }}
        >
          <input name="title" placeholder="Título del documento" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" required />
          <select name="type" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input name="folder" placeholder="Carpeta (ej: Actas)" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
          <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[12.5px] sm:col-span-3" />
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            {createMutation.isPending ? 'Subiendo…' : 'Guardar'}
          </button>
          {createMutation.error && <p className="text-[11px] sm:col-span-4" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6.5 mb-7">
        {folders.length === 0 && !isLoading && <p className="text-[12.5px] text-muted col-span-full">Sin documentos todavía.</p>}
        {folders.map((f) => (
          <div key={f.label} className="bg-card border border-line rounded-[13px] p-4.5 p-[18px] text-center transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
            <span className="inline-flex w-10 h-10 rounded-[10px] items-center justify-center mb-2.5" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
              <FolderOpen size={18} />
            </span>
            <div className="text-[13px] font-semibold text-ink">{f.label}</div>
            <div className="font-mono text-[11px] text-muted mt-0.5">{f.count} docs</div>
          </div>
        ))}
      </div>

      <h3 className="text-[15px] text-ink mb-3 font-bold">{search ? 'Resultados' : 'Recientes'}</h3>
      <div className="bg-card border border-line rounded-card overflow-hidden">
        {filtered.length === 0 && <p className="p-4 text-[12.5px] text-muted">Sin resultados.</p>}
        {filtered.slice(0, 12).map((d) => (
          <div key={d.id} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-[18px] border-b border-line last:border-0 hover:bg-hover transition-colors">
            <span className="w-[34px] h-[34px] shrink-0 rounded-[9px] bg-sunken text-muted flex items-center justify-center">
              <FileText size={17} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{d.title}</div>
              <div className="font-mono text-[11px] text-muted mt-0.5">{d.type} · {d.authorName ?? '—'}</div>
            </div>
            {d.fileUrl && (
              <button onClick={() => handleDownload(d)} className="shrink-0 text-muted hover:text-[var(--accent)] transition-colors">
                <Download size={17} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
