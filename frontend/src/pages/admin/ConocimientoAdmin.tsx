import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, ExternalLink, FileText } from 'lucide-react'
import { Badge } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

const TYPES = [
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'GUIA', label: 'Guía' },
  { value: 'CASO_EXITO', label: 'Caso de éxito' },
  { value: 'ARTICULO', label: 'Artículo' },
  { value: 'ENLACE', label: 'Enlace' },
  { value: 'LECCION', label: 'Lección aprendida' },
  { value: 'PUBLICACION', label: 'Publicación' },
  { value: 'INFORME', label: 'Informe' },
  { value: 'PRESENTACION', label: 'Presentación' },
  { value: 'ACTA', label: 'Acta' },
  { value: 'RESOLUCION', label: 'Resolución' },
  { value: 'CONVENIO', label: 'Convenio' },
]

interface KnowledgeItem {
  id: string
  title: string
  type: string
  authorName: string | null
  fileUrl: string | null
  linkUrl: string | null
  isPublic: boolean
  downloads: number
}

/** CRUD completo de Conocimiento dentro de Contenido Público: crea,
 * edita, elimina y publica/oculta documentos, manuales, casos de éxito,
 * artículos y enlaces, reutilizando directamente los endpoints reales
 * de /knowledge (el mismo backend que usa /app/conocimiento) — no se
 * duplica el modelo, solo se ofrece esta vista de administración
 * adicional centrada en la visibilidad pública. */
export default function ConocimientoAdmin() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('knowledge.manage')
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const { data, isLoading } = useQuery<KnowledgeItem[]>({
    queryKey: ['knowledge'],
    queryFn: async () => (await api.get('/knowledge')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['knowledge'] })

  const saveMutation = useMutation({
    mutationFn: async (values: { title: string; type: string; authorName: string; linkUrl: string; isPublic: boolean }) => {
      let fileUrl: string | undefined
      if (file) {
        const form = new FormData()
        form.append('file', file)
        const upload = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        fileUrl = upload.data.id
      }
      const payload = { ...values, ...(fileUrl ? { fileUrl } : {}) }
      return editing ? api.patch(`/knowledge/${editing.id}`, payload) : api.post('/knowledge', payload)
    },
    onSuccess: () => { invalidate(); closeForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge/${id}`),
    onSuccess: invalidate,
  })

  const toggleVisibility = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) => api.patch(`/knowledge/${id}`, { isPublic }),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setFile(null)
    setShowForm(true)
  }
  const openEdit = (item: KnowledgeItem) => {
    setEditing(item)
    setFile(null)
    setShowForm(true)
  }
  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setFile(null)
  }

  return (
    <div>
      <p className="text-[12.5px] text-muted mb-4">
        Administra documentos, manuales, casos de éxito, artículos y enlaces de <strong>/conocimiento</strong>. Este
        mismo contenido también es visible para el Comité en{' '}
        <a href="/app/conocimiento" className="font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}>
          Conocimiento interno <ExternalLink size={12} />
        </a>.
      </p>

      {canManage && (
        <div className="flex justify-end mb-4">
          <button onClick={openCreate} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
      )}

      {showForm && (
        <form
          className="bg-card border border-line rounded-card p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const title = (form.elements.namedItem('title') as HTMLInputElement).value
            const type = (form.elements.namedItem('type') as HTMLSelectElement).value
            const authorName = (form.elements.namedItem('authorName') as HTMLInputElement).value
            const linkUrl = (form.elements.namedItem('linkUrl') as HTMLInputElement).value
            const isPublic = (form.elements.namedItem('isPublic') as HTMLInputElement).checked
            if (title) saveMutation.mutate({ title, type, authorName, linkUrl, isPublic })
          }}
        >
          <div className="flex items-center justify-between sm:col-span-2">
            <h3 className="text-[15px] font-bold text-ink">{editing ? 'Editar' : 'Nuevo'}</h3>
            <button type="button" onClick={closeForm} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {saveMutation.error && <p className="sm:col-span-2 text-[12.5px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveMutation.error)}</p>}
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Título</span>
            <input name="title" defaultValue={editing?.title} required className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Tipo</span>
            <select name="type" defaultValue={editing?.type ?? 'DOCUMENTO'} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Autor</span>
            <input name="authorName" defaultValue={editing?.authorName ?? ''} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Enlace externo (para tipo "Enlace" o links de referencia)</span>
            <input name="linkUrl" defaultValue={editing?.linkUrl ?? ''} placeholder="https://…" className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Archivo (PDF/DOC/DOCX) — opcional, reemplaza el actual si se sube uno nuevo</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[12.5px]" />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="isPublic" defaultChecked={editing?.isPublic ?? false} className="w-4 h-4" />
            <span className="text-[13px] text-body font-semibold">Publicado en /conocimiento</span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saveMutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && (data?.length ?? 0) === 0 && <p className="p-5 text-[13px] text-muted">No hay documentos creados todavía.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Descargas</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[120px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((k) => (
                <tr key={k.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink font-medium">
                    <FileText size={13} className="inline mr-1.5 -mt-0.5 text-muted" />
                    {k.title}
                  </td>
                  <td className="px-4 py-3 text-muted font-mono text-[11.5px]">{k.type}</td>
                  <td className="px-4 py-3 text-muted font-mono text-[11.5px]">{k.downloads}</td>
                  <td className="px-4 py-3">
                    {k.isPublic ? (
                      <Badge color="var(--green-600)" bg="var(--green-50)">PUBLICADO</Badge>
                    ) : (
                      <Badge color="var(--slate-500)" bg="var(--slate-100)">OCULTO</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        title={canManage ? (k.isPublic ? 'Ocultar de /conocimiento' : 'Publicar en /conocimiento') : 'Requiere permiso knowledge.manage'}
                        disabled={!canManage}
                        onClick={() => toggleVisibility.mutate({ id: k.id, isPublic: !k.isPublic })}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body disabled:opacity-30"
                      >
                        {k.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {canManage && (
                        <>
                          <button title="Editar" onClick={() => openEdit(k)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                            <Pencil size={14} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => { if (confirm('¿Eliminar este documento?')) deleteMutation.mutate(k.id) }}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
