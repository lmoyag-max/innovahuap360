import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { Eyebrow, Dot } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { STAGES, STAGE_ORDER, RISK_META, type ProjectStage, type RiskLevel } from '../../lib/stages'

interface ProjectRow {
  id: string
  name: string
  ownerName: string
  sponsor: string | null
  stage: ProjectStage
  riskLevel: RiskLevel
  kpiSummary: string | null
  dueDate: string | null
}

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  ownerName: z.string().min(2, 'Requerido'),
  sponsor: z.string().optional(),
  category: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—'
}

export default function Portafolio() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: projects } = useQuery<ProjectRow[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post('/projects', { ...values, stage: 'IDEA' }),
    onSuccess: () => { invalidate(); setShowForm(false); reset() },
  })
  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ProjectStage }) => api.patch(`/projects/${id}/stage`, { stage }),
    onSuccess: invalidate,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    cards: projects?.filter((p) => p.stage === stage) ?? [],
  }))

  return (
    <div className="animate-viewin h-full flex flex-col">
      <div className="shrink-0 p-4 sm:px-6 sm:pt-[22px] sm:pb-3.5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <Eyebrow>PORTAFOLIO</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Tablero Kanban de proyectos
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="text-[12.5px] text-muted bg-card border border-line px-3 py-2 rounded-md">
            {projects?.length ?? 0} proyectos
          </span>
          {canManage && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[13px]"
              style={{ background: 'var(--accent)' }}
            >
              {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Cerrar' : 'Nuevo'}
            </button>
          )}
        </div>
      </div>

      {stageMutation.error && (
        <div className="shrink-0 px-4 sm:px-6 mb-3.5">
          <p className="text-[12.5px] p-2.5 rounded-md" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
            {apiErrorMessage(stageMutation.error)}
          </p>
        </div>
      )}

      {showForm && (
        <div className="shrink-0 px-4 sm:px-6 mb-3.5">
          <div className="bg-card border border-line rounded-card p-4">
            {createMutation.error && <p className="text-[12.5px] mb-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
            <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input placeholder="Nombre del proyecto" {...register('name')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" />
              <input placeholder="Responsable" {...register('ownerName')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
              <input placeholder="Sponsor (opcional)" {...register('sponsor')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
              <button type="submit" disabled={createMutation.isPending} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] sm:col-span-4 sm:w-fit disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {createMutation.isPending ? 'Creando…' : 'Crear idea/proyecto'}
              </button>
              {(errors.name || errors.ownerName) && (
                <p className="text-[11px] sm:col-span-4" style={{ color: 'var(--accent)' }}>
                  {errors.name?.message ?? errors.ownerName?.message}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tablero con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-6 min-h-0">
        <div className="flex gap-3.5 h-full items-start w-max">
          {columns.map((col) => (
            <div key={col.stage} className="w-[264px] shrink-0 flex flex-col max-h-full">
              <div className="flex items-center gap-2 px-1 pb-3">
                <Dot color={STAGES[col.stage].color} />
                <span className="font-bold text-[13px] text-ink">{STAGES[col.stage].label}</span>
                <span className="font-mono text-[11px] text-muted bg-sunken px-[7px] rounded-full ml-auto">
                  {col.cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 overflow-y-auto p-0.5">
                {col.cards.map((c) => (
                  <div key={c.id} className="bg-card border border-line rounded-xl p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Dot color={RISK_META[c.riskLevel].color} size={7} />
                      <span className="font-mono text-[10px] text-muted">Riesgo {c.riskLevel.toLowerCase()}</span>
                    </div>
                    <div className="text-[13.5px] font-semibold text-ink leading-snug mb-2.5">{c.name}</div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="w-[22px] h-[22px] rounded-full bg-sunken text-muted flex items-center justify-center text-[9px] font-bold font-mono">
                        {initials(c.ownerName)}
                      </span>
                      <span className="text-[11.5px] text-muted truncate">{c.ownerName}{c.sponsor ? ` · ${c.sponsor}` : ''}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-line gap-2">
                      <span className="font-mono text-[11px] font-semibold truncate" style={{ color: 'var(--accent)' }}>{c.kpiSummary ?? '—'}</span>
                      {canManage ? (
                        <select
                          value={c.stage}
                          onChange={(e) => stageMutation.mutate({ id: c.id, stage: e.target.value as ProjectStage })}
                          className="font-mono text-[10px] text-subtle bg-transparent border-none outline-none shrink-0"
                        >
                          {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGES[s].label}</option>)}
                        </select>
                      ) : (
                        <span className="font-mono text-[10.5px] text-subtle">{c.dueDate ? new Date(c.dueDate).toLocaleDateString('es-CL') : '—'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
