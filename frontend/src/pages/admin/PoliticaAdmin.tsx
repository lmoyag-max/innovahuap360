import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, apiErrorMessage } from '../../lib/api'
import SectionItemsAdmin from './SectionItemsAdmin'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres'),
  excerpt: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

const TABS = [
  { key: 'content', label: 'Encabezado' },
  { key: 'items', label: 'Documentos y lineamientos' },
] as const

const ITEM_TYPES = [
  { value: 'PRINCIPIO', label: 'Principio' },
  { value: 'LINEAMIENTO', label: 'Lineamiento' },
  { value: 'OBJETIVO', label: 'Objetivo estratégico' },
  { value: 'DOCUMENTO', label: 'Documento descargable' },
]

export default function PoliticaAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('content')
  return (
    <div>
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="h-8 px-3 rounded-md text-[12px] font-semibold"
            style={tab === t.key ? { background: 'var(--surface-inset)', color: 'var(--accent)' } : { color: 'var(--text-muted)' }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'content' ? <ContentForm /> : <SectionItemsAdmin section="POLITICA" itemTypeOptions={ITEM_TYPES} />}
    </div>
  )
}

function ContentForm() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<FormValues>({
    queryKey: ['admin-politica-content'],
    queryFn: async () => (await api.get('/admin/public-content/politica')).data,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.put('/admin/public-content/politica', values),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-politica-content'] })
      reset(res.data)
    },
  })

  if (isLoading) return <p className="text-[13px] text-muted">Cargando…</p>

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="bg-card border border-line rounded-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl">
      {mutation.error && <p className="sm:col-span-2 text-[12.5px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(mutation.error)}</p>}
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-semibold text-body">Título</span>
        <input {...register('title')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
        {errors.title && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.title.message}</span>}
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-semibold text-body">Bajada</span>
        <input {...register('excerpt')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-semibold text-body">Texto principal (HTML simple permitido)</span>
        <textarea {...register('body')} rows={5} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px]" />
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-semibold text-body">URL de imagen</span>
        <input {...register('imageUrl')} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" {...register('isPublished')} className="w-4 h-4" />
        <span className="text-[13px] text-body font-semibold">Publicado en /politica</span>
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={mutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
          {mutation.isPending ? 'Guardando…' : 'Guardar'}
        </button>
        {mutation.isSuccess && <span className="ml-3 text-[12.5px]" style={{ color: 'var(--green-600)' }}>Guardado.</span>}
      </div>
    </form>
  )
}
