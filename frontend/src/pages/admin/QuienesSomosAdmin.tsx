import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink, Image as ImageIcon, FileText, Upload, X } from 'lucide-react'
import { Badge } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

const TABS = [
  { key: 'content', label: 'Encabezado y descripción' },
  { key: 'members', label: 'Integrantes' },
  { key: 'axes', label: 'Ejes de trabajo' },
  { key: 'objectives', label: 'Objetivos' },
  { key: 'values', label: 'Valores' },
  { key: 'documents', label: 'Documentos' },
] as const
type TabKey = (typeof TABS)[number]['key']

export default function QuienesSomosAdmin() {
  const [tab, setTab] = useState<TabKey>('content')

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold transition-colors"
            style={
              tab === t.key
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface-inset)', color: 'var(--text-body)' }
            }
          >
            {t.label}
          </button>
        ))}
        <a
          href="/quienes-somos"
          target="_blank"
          rel="noreferrer"
          className="h-9 px-3.5 rounded-md border border-line text-body text-[12.5px] font-semibold inline-flex items-center gap-1.5 ml-auto"
        >
          <ExternalLink size={14} /> Vista previa
        </a>
      </div>

      {tab === 'content' && <ContentEditor />}
      {tab === 'members' && <MembersEditor />}
      {tab === 'axes' && <AxesEditor />}
      {tab === 'objectives' && <ObjectivesEditor />}
      {tab === 'values' && <ValuesEditor />}
      {tab === 'documents' && <DocumentsEditor />}
    </div>
  )
}

// ===================== Encabezado y descripción =====================

const contentSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  secondaryBody: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  purpose: z.string().optional(),
  imageUrl: z.string().optional(),
})
type ContentValues = z.infer<typeof contentSchema>

function ContentEditor() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<ContentValues & { isPublished: boolean }>({
    queryKey: ['about-content'],
    queryFn: async () => (await api.get('/admin/public-content/quienes-somos')).data,
  })

  const { register, handleSubmit, reset } = useForm<ContentValues>({
    resolver: zodResolver(contentSchema),
    values: data ?? undefined,
  })

  const mutation = useMutation({
    mutationFn: (payload: ContentValues & { isPublished: boolean }) => api.put('/admin/public-content/quienes-somos', payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['about-content'], res.data)
      reset(res.data)
    },
  })

  const onSave = (isPublished: boolean) => handleSubmit((values) => mutation.mutate({ ...values, isPublished }))()

  if (isLoading) return <p className="text-[13px] text-muted">Cargando…</p>

  return (
    <div className="bg-card border border-line rounded-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink">Contenido general de "Quiénes Somos"</h3>
        {data?.isPublished ? (
          <Badge color="var(--green-600)" bg="var(--green-50)">PUBLICADO</Badge>
        ) : (
          <Badge color="var(--slate-500)" bg="var(--slate-100)">BORRADOR</Badge>
        )}
      </div>
      {mutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(mutation.error)}</p>}

      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-body">Título de la página</span>
          <input {...register('title')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-body">Bajada o subtítulo</span>
          <input {...register('excerpt')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-body">URL de imagen principal (opcional)</span>
          <input {...register('imageUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <div />
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-body">Texto principal</span>
          <textarea {...register('body')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-body">Texto secundario</span>
          <textarea {...register('secondaryBody')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-body">Misión</span>
          <textarea {...register('mission')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-body">Visión</span>
          <textarea {...register('vision')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-[12px] font-semibold text-body">Propósito</span>
          <textarea {...register('purpose')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
        </label>

        <div className="sm:col-span-2 flex gap-2.5 mt-1">
          <button
            type="button"
            onClick={() => onSave(false)}
            disabled={mutation.isPending}
            className="h-10 px-4 rounded-md border border-line text-body font-semibold text-[13px] disabled:opacity-60"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => onSave(true)}
            disabled={mutation.isPending}
            className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {mutation.isPending ? 'Guardando…' : 'Publicar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ===================== Integrantes =====================

interface AboutMember {
  id: string
  name: string
  role: string
  unit: string | null
  committeeRole: string | null
  email: string | null
  photoUploadId: string | null
  sortOrder: number
  isActive: boolean
}

const memberSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  role: z.string().min(2, 'Mínimo 2 caracteres'),
  unit: z.string().optional(),
  committeeRole: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
})
type MemberValues = z.infer<typeof memberSchema>

function MembersEditor() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AboutMember | null>(null)
  const [showForm, setShowForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery<AboutMember[]>({
    queryKey: ['about-members'],
    queryFn: async () => (await api.get('/admin/public-content/quienes-somos/members')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['about-members'] })

  const createMutation = useMutation({
    mutationFn: (values: MemberValues) => api.post('/admin/public-content/quienes-somos/members', values),
    onSuccess: () => { invalidate(); closeForm() },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: MemberValues }) => api.patch(`/admin/public-content/quienes-somos/members/${id}`, values),
    onSuccess: () => { invalidate(); closeForm() },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/public-content/quienes-somos/members/${id}`),
    onSuccess: invalidate,
  })
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/public-content/quienes-somos/members/${id}`, { isActive }),
    onSuccess: invalidate,
  })
  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/admin/public-content/quienes-somos/members/${id}/photo`, form)
    },
    onSuccess: invalidate,
  })
  const removePhotoMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/public-content/quienes-somos/members/${id}/photo`),
    onSuccess: invalidate,
  })
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => api.put('/admin/public-content/quienes-somos/members/reorder', { items }),
    onSuccess: invalidate,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberValues>({ resolver: zodResolver(memberSchema) })

  const openCreate = () => { setEditing(null); reset({ name: '', role: '', unit: '', committeeRole: '', email: '' }); setShowForm(true) }
  const openEdit = (m: AboutMember) => { setEditing(m); reset({ name: m.name, role: m.role, unit: m.unit ?? '', committeeRole: m.committeeRole ?? '', email: m.email ?? '' }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }
  const onSubmit = (values: MemberValues) => {
    const payload = { ...values, email: values.email || undefined }
    if (editing) updateMutation.mutate({ id: editing.id, values: payload })
    else createMutation.mutate(payload)
  }

  const move = (index: number, dir: -1 | 1) => {
    if (!data) return
    const items = [...data]
    const j = index + dir
    if (j < 0 || j >= items.length) return
    ;[items[index], items[j]] = [items[j], items[index]]
    reorderMutation.mutate(items.map((m, i) => ({ id: m.id, sortOrder: i })))
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error || updateMutation.error

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openCreate} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
          <Plus size={15} /> Nuevo integrante
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-ink">{editing ? 'Editar integrante' : 'Nuevo integrante'}</h3>
            <button onClick={closeForm} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {saveError && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveError)}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Nombre</span>
              <input {...register('name')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.name && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.name.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Cargo</span>
              <input {...register('role')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.role && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.role.message}</span>}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Servicio/unidad</span>
              <input {...register('unit')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Rol dentro del comité</span>
              <input {...register('committeeRole')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-body">Correo (opcional)</span>
              <input {...register('email')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.email && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.email.message}</span>}
            </label>

            {editing && (
              <div className="sm:col-span-2 flex items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f && editing) photoMutation.mutate({ id: editing.id, file: f }) }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-9 px-3 rounded-md border border-line text-body text-[12px] font-semibold inline-flex items-center gap-1.5">
                  <ImageIcon size={14} /> {editing.photoUploadId ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {editing.photoUploadId && (
                  <button type="button" onClick={() => removePhotoMutation.mutate(editing.id)} className="h-9 px-3 rounded-md border border-line text-body text-[12px] font-semibold">
                    Quitar foto
                  </button>
                )}
              </div>
            )}
            {!editing && <p className="sm:col-span-2 text-[11.5px] text-muted">Guarda primero al integrante para poder subirle una fotografía.</p>}

            <div className="sm:col-span-2 flex gap-2.5 mt-1">
              <button type="submit" disabled={saving} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={closeForm} className="h-10 px-4 rounded-md border border-line text-body font-semibold text-[13px]">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && data?.length === 0 && <p className="p-5 text-[13px] text-muted">Sin integrantes registrados.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Cargo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[200px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m, i) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted">{m.role}</td>
                  <td className="px-4 py-3">
                    {m.isActive ? <Badge color="var(--green-600)" bg="var(--green-50)">ACTIVO</Badge> : <Badge color="var(--slate-500)" bg="var(--slate-100)">INACTIVO</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowUp size={13} /></button>
                      <button title="Bajar" disabled={i === data.length - 1} onClick={() => move(i, 1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowDown size={13} /></button>
                      <button title={m.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActiveMutation.mutate({ id: m.id, isActive: !m.isActive })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line">
                        {m.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button title="Editar" onClick={() => openEdit(m)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line"><Pencil size={13} /></button>
                      <button title="Eliminar" onClick={() => { if (confirm('¿Eliminar este integrante?')) deleteMutation.mutate(m.id) }} className="w-7 h-7 flex items-center justify-center rounded-md border border-line"><Trash2 size={13} /></button>
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

// ===================== Ejes / Objetivos / Valores (genérico) =====================

interface SimpleItem { id: string; name?: string; title?: string; description: string | null; sortOrder: number; isActive: boolean }

function useSimpleListEditor(basePath: string, queryKey: string, labelField: 'name' | 'title') {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<SimpleItem[]>({ queryKey: [queryKey], queryFn: async () => (await api.get(basePath)).data })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] })
  const createMutation = useMutation({ mutationFn: (values: Record<string, unknown>) => api.post(basePath, values), onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => api.patch(`${basePath}/${id}`, values), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`${basePath}/${id}`), onSuccess: invalidate })
  const toggleActiveMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`${basePath}/${id}`, { isActive }), onSuccess: invalidate })
  const reorderMutation = useMutation({ mutationFn: (items: { id: string; sortOrder: number }[]) => api.put(`${basePath}/reorder`, { items }), onSuccess: invalidate })

  const move = (index: number, dir: -1 | 1) => {
    if (!data) return
    const items = [...data]
    const j = index + dir
    if (j < 0 || j >= items.length) return
    ;[items[index], items[j]] = [items[j], items[index]]
    reorderMutation.mutate(items.map((it, i) => ({ id: it.id, sortOrder: i })))
  }

  return { data, isLoading, createMutation, updateMutation, deleteMutation, toggleActiveMutation, move, labelField }
}

function SimpleListEditor({
  basePath, queryKey, labelField, labelText, schema, defaultValues, fields,
}: {
  basePath: string
  queryKey: string
  labelField: 'name' | 'title'
  labelText: string
  schema: z.ZodType<Record<string, unknown>>
  defaultValues: Record<string, unknown>
  fields: { name: string; label: string; type: 'input' | 'textarea' }[]
}) {
  const { data, isLoading, createMutation, updateMutation, deleteMutation, toggleActiveMutation, move } = useSimpleListEditor(basePath, queryKey, labelField)
  const [editing, setEditing] = useState<SimpleItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const openCreate = () => { setEditing(null); reset(defaultValues); setShowForm(true) }
  const openEdit = (item: SimpleItem) => { setEditing(item); reset({ ...item, description: item.description ?? '' }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }
  const onSubmit = (values: Record<string, unknown>) => {
    if (editing) updateMutation.mutate({ id: editing.id, values })
    else createMutation.mutate(values)
    closeForm()
  }

  const saving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error || updateMutation.error

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={openCreate} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
          <Plus size={15} /> Nuevo {labelText.toLowerCase()}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-ink">{editing ? `Editar ${labelText.toLowerCase()}` : `Nuevo ${labelText.toLowerCase()}`}</h3>
            <button onClick={closeForm} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {saveError && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveError)}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3.5">
            {fields.map((f) => (
              <label key={f.name} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">{f.label}</span>
                {f.type === 'textarea' ? (
                  <textarea {...register(f.name)} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
                ) : (
                  <input {...register(f.name)} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
                )}
                {errors[f.name] && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{String(errors[f.name]?.message)}</span>}
              </label>
            ))}
            <div className="flex gap-2.5 mt-1">
              <button type="submit" disabled={saving} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={closeForm} className="h-10 px-4 rounded-md border border-line text-body font-semibold text-[13px]">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && data?.length === 0 && <p className="p-5 text-[13px] text-muted">Sin elementos registrados.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">{labelText}</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[180px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink font-medium">{labelField === 'name' ? item.name : item.title}</td>
                  <td className="px-4 py-3">
                    {item.isActive ? <Badge color="var(--green-600)" bg="var(--green-50)">ACTIVO</Badge> : <Badge color="var(--slate-500)" bg="var(--slate-100)">INACTIVO</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowUp size={13} /></button>
                      <button title="Bajar" disabled={i === data.length - 1} onClick={() => move(i, 1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowDown size={13} /></button>
                      <button title={item.isActive ? 'Desactivar' : 'Activar'} onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line">
                        {item.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button title="Editar" onClick={() => openEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line"><Pencil size={13} /></button>
                      <button title="Eliminar" onClick={() => { if (confirm('¿Eliminar este elemento?')) deleteMutation.mutate(item.id) }} className="w-7 h-7 flex items-center justify-center rounded-md border border-line"><Trash2 size={13} /></button>
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

const axisSchema = z.object({ name: z.string().min(2, 'Mínimo 2 caracteres'), description: z.string().optional(), icon: z.string().optional() })
function AxesEditor() {
  return (
    <SimpleListEditor
      basePath="/admin/public-content/quienes-somos/axes"
      queryKey="about-axes"
      labelField="name"
      labelText="Eje"
      schema={axisSchema}
      defaultValues={{ name: '', description: '', icon: '' }}
      fields={[{ name: 'name', label: 'Nombre del eje', type: 'input' }, { name: 'description', label: 'Descripción', type: 'textarea' }, { name: 'icon', label: 'Ícono (opcional)', type: 'input' }]}
    />
  )
}

const objectiveSchema = z.object({ title: z.string().min(2, 'Mínimo 2 caracteres'), description: z.string().optional() })
function ObjectivesEditor() {
  return (
    <SimpleListEditor
      basePath="/admin/public-content/quienes-somos/objectives"
      queryKey="about-objectives"
      labelField="title"
      labelText="Objetivo"
      schema={objectiveSchema}
      defaultValues={{ title: '', description: '' }}
      fields={[{ name: 'title', label: 'Título', type: 'input' }, { name: 'description', label: 'Descripción', type: 'textarea' }]}
    />
  )
}

const valueSchema = z.object({ name: z.string().min(2, 'Mínimo 2 caracteres'), description: z.string().optional() })
function ValuesEditor() {
  return (
    <SimpleListEditor
      basePath="/admin/public-content/quienes-somos/values"
      queryKey="about-values"
      labelField="name"
      labelText="Valor"
      schema={valueSchema}
      defaultValues={{ name: '', description: '' }}
      fields={[{ name: 'name', label: 'Nombre', type: 'input' }, { name: 'description', label: 'Descripción', type: 'textarea' }]}
    />
  )
}

// ===================== Documentos =====================

interface AboutDocument {
  id: string
  name: string
  description: string | null
  isPublished: boolean
  sortOrder: number
  fileUpload: { originalName: string; mimeType: string; sizeBytes: number }
}

function DocumentsEditor() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery<AboutDocument[]>({
    queryKey: ['about-documents'],
    queryFn: async () => (await api.get('/admin/public-content/quienes-somos/documents')).data,
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['about-documents'] })

  const createMutation = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('name', name)
      form.append('description', description)
      if (file) form.append('file', file)
      return api.post('/admin/public-content/quienes-somos/documents', form)
    },
    onSuccess: () => { invalidate(); setShowForm(false); setName(''); setDescription(''); setFile(null) },
  })
  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete(`/admin/public-content/quienes-somos/documents/${id}`), onSuccess: invalidate })
  const togglePublishedMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => api.patch(`/admin/public-content/quienes-somos/documents/${id}`, { isPublished }),
    onSuccess: invalidate,
  })
  const reorderMutation = useMutation({ mutationFn: (items: { id: string; sortOrder: number }[]) => api.put('/admin/public-content/quienes-somos/documents/reorder', { items }), onSuccess: invalidate })

  const move = (index: number, dir: -1 | 1) => {
    if (!data) return
    const items = [...data]
    const j = index + dir
    if (j < 0 || j >= items.length) return
    ;[items[index], items[j]] = [items[j], items[index]]
    reorderMutation.mutate(items.map((it, i) => ({ id: it.id, sortOrder: i })))
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm((v) => !v)} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
          <Plus size={15} /> Nuevo documento
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-line rounded-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-ink">Nuevo documento</h3>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink"><X size={18} /></button>
          </div>
          {createMutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }} className="grid grid-cols-1 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Descripción (opcional)</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-body">Archivo (PDF, DOC o DOCX)</span>
              <input type="file" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
            </label>
            <div className="flex gap-2.5 mt-1">
              <button type="submit" disabled={createMutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5 disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                <Upload size={14} /> {createMutation.isPending ? 'Subiendo…' : 'Subir documento'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="h-10 px-4 rounded-md border border-line text-body font-semibold text-[13px]">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-5 text-[13px] text-muted">Cargando…</p>}
        {!isLoading && data?.length === 0 && <p className="p-5 text-[13px] text-muted">Sin documentos cargados.</p>}
        {!isLoading && data && data.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-muted text-[11.5px]">
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Archivo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold w-[180px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink font-medium">
                    <div className="flex items-center gap-2"><FileText size={14} className="text-muted shrink-0" /> {d.name}</div>
                    {d.description && <div className="text-[11.5px] text-muted mt-0.5">{d.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted text-[11.5px] font-mono">{d.fileUpload.originalName} · {(d.fileUpload.sizeBytes / 1024).toFixed(0)} KB</td>
                  <td className="px-4 py-3">
                    {d.isPublished ? <Badge color="var(--green-600)" bg="var(--green-50)">PUBLICADO</Badge> : <Badge color="var(--slate-500)" bg="var(--slate-100)">BORRADOR</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowUp size={13} /></button>
                      <button title="Bajar" disabled={i === data.length - 1} onClick={() => move(i, 1)} className="w-7 h-7 flex items-center justify-center rounded-md border border-line disabled:opacity-30"><ArrowDown size={13} /></button>
                      <button title={d.isPublished ? 'Despublicar' : 'Publicar'} onClick={() => togglePublishedMutation.mutate({ id: d.id, isPublished: !d.isPublished })} className="w-7 h-7 flex items-center justify-center rounded-md border border-line">
                        {d.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button title="Eliminar" onClick={() => { if (confirm('¿Eliminar este documento?')) deleteMutation.mutate(d.id) }} className="w-7 h-7 flex items-center justify-center rounded-md border border-line"><Trash2 size={13} /></button>
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
