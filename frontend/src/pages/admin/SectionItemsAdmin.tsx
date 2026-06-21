import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Upload, Download, FileX, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import { Badge } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  slug: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().optional(),
  itemType: z.string().optional(),
  category: z.string().optional(),
  linkUrl: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  registrationUrl: z.string().optional(),
  expectedBenefits: z.string().optional(),
  relatedProjectId: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface ContentItem extends FormValues {
  id: string
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
  documentUploadId: string | null
}

interface RelatedProject {
  id: string
  name: string
  category: string | null
  stage: string
}

/** Administración de los "items" de una sección del CMS genérico
 * (Política, Observatorio, Eventos, Portafolio público): reutiliza el
 * mismo backend de Contenido Público (create/update/delete/publish/
 * feature/reorder/duplicar), fijando `section` para no mezclar con
 * otras páginas. */
export default function SectionItemsAdmin({
  section,
  itemTypeOptions,
  showEventFields,
  showPortfolioFields,
}: {
  section: string
  itemTypeOptions?: { value: string; label: string }[]
  showEventFields?: boolean
  showPortfolioFields?: boolean
}) {
  const { hasPermission } = useAuth()
  const canDelete = hasPermission('public_content.delete')
  const canPublish = hasPermission('public_content.publish')

  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const queryKey = ['admin-public-content', section]
  const { data, isLoading } = useQuery<ContentItem[]>({
    queryKey,
    queryFn: async () => (await api.get('/admin/public-content', { params: { section } })).data,
  })

  const { data: relatedProjects } = useQuery<RelatedProject[]>({
    queryKey: ['admin-portfolio-related-projects'],
    queryFn: async () => (await api.get('/admin/public-content/portafolio/proyectos')).data,
    enabled: Boolean(showPortfolioFields),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/admin/public-content', { ...values, section }),
    onSuccess: () => { invalidate(); closeForm() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) => api.patch(`/admin/public-content/${id}`, values),
    onSuccess: () => { invalidate(); closeForm() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/public-content/${id}`),
    onSuccess: invalidate,
  })
  const togglePublished = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/admin/public-content/${id}/published`, { isPublished }),
    onSuccess: invalidate,
  })
  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/admin/public-content/${id}/featured`, { isFeatured }),
    onSuccess: invalidate,
  })
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => api.put('/admin/public-content/reorder', { items }),
    onSuccess: invalidate,
  })
  const uploadDocMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/admin/public-content/${id}/document`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: invalidate,
  })
  const removeDocMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/public-content/${id}/document`),
    onSuccess: invalidate,
  })
  const duplicateMutation = useMutation({
    mutationFn: (item: ContentItem) => {
      const { id, isPublished, isFeatured, sortOrder, documentUploadId, ...rest } = item
      void id; void isPublished; void isFeatured; void sortOrder; void documentUploadId
      return api.post('/admin/public-content', {
        ...rest,
        section,
        title: `${item.title} (copia)`,
        slug: `${item.slug}-copia-${Date.now().toString(36)}`,
      })
    },
    onSuccess: invalidate,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditing(null)
    reset({ title: '', slug: '', excerpt: '', body: '', imageUrl: '', itemType: '', category: '', linkUrl: '', eventDate: '', eventLocation: '', registrationUrl: '', expectedBenefits: '', relatedProjectId: '' })
    setShowForm(true)
  }
  const openEdit = (item: ContentItem) => {
    setEditing(item)
    reset({ ...item, eventDate: item.eventDate ? String(item.eventDate).slice(0, 16) : '' })
    setShowForm(true)
  }
  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const onSubmit = (values: FormValues) => {
    // Las fechas opcionales no aceptan string vacío en el backend
    // (@IsDateString) — se omiten en vez de enviarlas en blanco.
    const cleaned: FormValues = { ...values }
    if (!cleaned.eventDate) delete cleaned.eventDate
    if (editing) updateMutation.mutate({ id: editing.id, values: cleaned })
    else createMutation.mutate(cleaned)
  }

  const move = (index: number, dir: -1 | 1) => {
    if (!data) return
    const target = index + dir
    if (target < 0 || target >= data.length) return
    const a = data[index]
    const b = data[target]
    reorderMutation.mutate([{ id: a.id, sortOrder: b.sortOrder }, { id: b.id, sortOrder: a.sortOrder }])
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error || updateMutation.error
  const sorted = (data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={16} /> Nuevo {showPortfolioFields ? 'proyecto público' : 'item'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-ink">{editing ? 'Editar item' : 'Nuevo item'}</h3>
            <button onClick={closeForm} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {saveError && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveError)}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Slug (URL)</span>
              <input {...register('slug')} placeholder="mi-item-2026" className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.slug && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.slug.message}</span>}
            </label>
            {itemTypeOptions ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Tipo</span>
                <select {...register('itemType')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                  <option value="">—</option>
                  {itemTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Categoría</span>
                <input {...register('category')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              </label>
            )}
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Título</span>
              <input {...register('title')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.title && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.title.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">{showPortfolioFields ? 'Descripción pública' : 'Extracto'}</span>
              <input {...register('excerpt')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Cuerpo (HTML simple permitido)</span>
              <textarea {...register('body')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">{showPortfolioFields ? 'Imagen principal (URL)' : 'URL de imagen'}</span>
              <input {...register('imageUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Link externo</span>
              <input {...register('linkUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            {showPortfolioFields && (
              <>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[12px] font-semibold text-body">Beneficios esperados</span>
                  <textarea {...register('expectedBenefits')} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[12px] font-semibold text-body">Proyecto interno relacionado (opcional, solo referencia)</span>
                  <select {...register('relatedProjectId')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                    <option value="">— Sin vincular —</option>
                    {(relatedProjects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stage})</option>)}
                  </select>
                </label>
              </>
            )}
            {showEventFields && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-body">Fecha y hora</span>
                  <input type="datetime-local" {...register('eventDate')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-body">Lugar</span>
                  <input {...register('eventLocation')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[12px] font-semibold text-body">Link de inscripción</span>
                  <input {...register('registrationUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
                </label>
              </>
            )}
            <div className="sm:col-span-2 flex gap-2.5 mt-1">
              <button type="submit" disabled={saving} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={closeForm} className="h-10 px-4 rounded-md border border-line text-body font-semibold text-[13px]">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && sorted.length === 0 && <p className="p-5 text-[13px] text-muted">Sin items en esta sección todavía.</p>}
        {!isLoading && sorted.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold w-[70px]">Orden</th>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold w-[210px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, i) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <button disabled={i === 0} onClick={() => move(i, -1)} className="w-6 h-6 flex items-center justify-center rounded text-muted disabled:opacity-30 hover:text-ink">
                        <ArrowUp size={13} />
                      </button>
                      <button disabled={i === sorted.length - 1} onClick={() => move(i, 1)} className="w-6 h-6 flex items-center justify-center rounded text-muted disabled:opacity-30 hover:text-ink">
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink font-medium">
                    {item.title}
                    {item.category && <span className="ml-2 font-mono text-[10.5px] text-subtle">{item.category}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {item.isPublished ? (
                      <Badge color="var(--green-600)" bg="var(--green-50)">PUBLICADO</Badge>
                    ) : (
                      <Badge color="var(--slate-500)" bg="var(--slate-100)">BORRADOR</Badge>
                    )}
                    {item.isFeatured && <Badge className="ml-1.5">DESTACADO</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      ref={(el) => { fileInputs.current[item.id] = el }}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadDocMutation.mutate({ id: item.id, file })
                        e.target.value = ''
                      }}
                    />
                    {item.documentUploadId ? (
                      <div className="flex items-center gap-1.5">
                        <a href={`${api.defaults.baseURL}/public/content/${item.id}/document`} className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                          <Download size={13} className="inline -mt-0.5" /> Ver
                        </a>
                        <button title="Quitar documento" onClick={() => removeDocMutation.mutate(item.id)} className="text-muted hover:text-ink">
                          <FileX size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => fileInputs.current[item.id]?.click()} className="text-[12px] font-semibold inline-flex items-center gap-1 text-muted hover:text-ink">
                        <Upload size={13} /> Subir
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        title={item.isPublished ? 'Despublicar' : 'Publicar'}
                        disabled={!canPublish}
                        onClick={() => togglePublished.mutate({ id: item.id, isPublished: !item.isPublished })}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body disabled:opacity-30"
                      >
                        {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        title="Destacar"
                        disabled={!canPublish}
                        onClick={() => toggleFeatured.mutate({ id: item.id, isFeatured: !item.isFeatured })}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body disabled:opacity-30"
                      >
                        <Star size={14} fill={item.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                      <button title="Editar" onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Pencil size={14} />
                      </button>
                      <button title="Duplicar" onClick={() => duplicateMutation.mutate(item)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Copy size={14} />
                      </button>
                      <button
                        title={canDelete ? 'Eliminar' : 'Solo administradores pueden eliminar'}
                        disabled={!canDelete}
                        onClick={() => { if (confirm('¿Eliminar este item?')) deleteMutation.mutate(item.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
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
