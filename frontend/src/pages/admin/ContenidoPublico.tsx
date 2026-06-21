import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X } from 'lucide-react'
import { Eyebrow, Badge } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import QuienesSomosAdmin from './QuienesSomosAdmin'

const SECTIONS = [
  'HOME', 'QUIENES_SOMOS', 'POLITICA', 'PORTAFOLIO', 'OBSERVATORIO',
  'CONOCIMIENTO', 'EVENTOS', 'NOTICIA', 'BANNER',
] as const

const schema = z.object({
  section: z.enum(SECTIONS),
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  slug: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface ContentItem extends FormValues {
  id: string
  isPublished: boolean
  isFeatured: boolean
  sortOrder: number
}

export default function ContenidoPublico() {
  const [view, setView] = useState<'general' | 'quienes-somos'>('general')
  return view === 'quienes-somos' ? (
    <div className="p-4 sm:p-6 animate-viewin">
      <ViewSwitcher view={view} setView={setView} />
      <QuienesSomosAdmin />
    </div>
  ) : (
    <ContenidoGenerico view={view} setView={setView} />
  )
}

function ViewSwitcher({ view, setView }: { view: 'general' | 'quienes-somos'; setView: (v: 'general' | 'quienes-somos') => void }) {
  return (
    <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
      <div>
        <Eyebrow>ADMINISTRACIÓN</Eyebrow>
        <h1 className="mt-1.5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Contenido público</h1>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setView('general')}
          className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold"
          style={view === 'general' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-inset)', color: 'var(--text-body)' }}
        >
          Contenido genérico
        </button>
        <button
          onClick={() => setView('quienes-somos')}
          className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold"
          style={view === 'quienes-somos' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-inset)', color: 'var(--text-body)' }}
        >
          Quiénes Somos
        </button>
      </div>
    </div>
  )
}

function ContenidoGenerico({ view, setView }: { view: 'general' | 'quienes-somos'; setView: (v: 'general' | 'quienes-somos') => void }) {
  const queryClient = useQueryClient()
  const [sectionFilter, setSectionFilter] = useState<string>('')
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['admin-public-content', sectionFilter],
    queryFn: async () => {
      const { data } = await api.get('/admin/public-content', { params: sectionFilter ? { section: sectionFilter } : {} })
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-public-content'] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/admin/public-content', values),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditing(null)
    reset({ section: 'HOME', title: '', slug: '', excerpt: '', body: '', imageUrl: '' })
    setShowForm(true)
  }
  const openEdit = (item: ContentItem) => {
    setEditing(item)
    reset(item)
    setShowForm(true)
  }
  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const onSubmit = (values: FormValues) => {
    if (editing) updateMutation.mutate({ id: editing.id, values })
    else createMutation.mutate(values)
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error || updateMutation.error

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <ViewSwitcher view={view} setView={setView} />

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="h-10 px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={16} /> Nuevo contenido
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-line bg-card text-[12.5px] text-body"
        >
          <option value="">Todas las secciones</option>
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-ink">{editing ? 'Editar contenido' : 'Nuevo contenido'}</h3>
            <button onClick={closeForm} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {saveError && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveError)}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Sección</span>
              <select {...register('section')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
                {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Slug (URL)</span>
              <input {...register('slug')} placeholder="mi-noticia-2026" className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.slug && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.slug.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Título</span>
              <input {...register('title')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.title && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.title.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Extracto</span>
              <input {...register('excerpt')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Cuerpo (HTML simple permitido)</span>
              <textarea {...register('body')} rows={4} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">URL de imagen</span>
              <input {...register('imageUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
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
        {!isLoading && data?.length === 0 && <p className="p-5 text-[13px] text-muted">Sin contenido para esta sección.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Sección</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[160px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted font-mono text-[11.5px]">{item.section}</td>
                  <td className="px-4 py-3">
                    {item.isPublished ? (
                      <Badge color="var(--green-600)" bg="var(--green-50)">PUBLICADO</Badge>
                    ) : (
                      <Badge color="var(--slate-500)" bg="var(--slate-100)">BORRADOR</Badge>
                    )}
                    {item.isFeatured && <Badge className="ml-1.5">DESTACADO</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title={item.isPublished ? 'Despublicar' : 'Publicar'} onClick={() => togglePublished.mutate({ id: item.id, isPublished: !item.isPublished })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button title="Destacar" onClick={() => toggleFeatured.mutate({ id: item.id, isFeatured: !item.isFeatured })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Star size={14} fill={item.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                      <button title="Editar" onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body">
                        <Pencil size={14} />
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => { if (confirm('¿Eliminar este contenido?')) deleteMutation.mutate(item.id) }}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body"
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
