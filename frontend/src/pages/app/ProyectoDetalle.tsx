import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, Circle, Image as ImageIcon, AlertTriangle, X,
} from 'lucide-react'
import { Eyebrow, Dot, Badge, ProgressBar } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { STAGES, RISK_META, timeAgo, type ProjectStage, type RiskLevel } from '../../lib/stages'

interface ProjectTask {
  id: string
  name: string
  ownerInitials: string
  progressPct: number
}
interface FeasibilityCriterion {
  id: string
  criterionName: string
  score: number
}
interface ProjectDetail {
  id: string
  name: string
  description: string | null
  category: string | null
  ownerName: string
  sponsor: string | null
  stage: ProjectStage
  riskLevel: RiskLevel
  kpiSummary: string | null
  dueDate: string | null
  startDate: string | null
  progressPct: number | null
  imageUrl: string | null
  tasks: ProjectTask[]
  feasibility: FeasibilityCriterion[]
}
interface StageHistoryEntry {
  id: string
  fromStage: ProjectStage | null
  toStage: ProjectStage
  changedByName: string | null
  note: string | null
  createdAt: string
}

const editSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  category: z.string().optional(),
  ownerName: z.string().min(2, 'Requerido'),
  sponsor: z.string().optional(),
  riskLevel: z.enum(['BAJO', 'MEDIO', 'ALTO']),
  kpiSummary: z.string().optional(),
  dueDate: z.string().optional(),
})
type EditValues = z.infer<typeof editSchema>

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('es-CL') : '—'
}
function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : ''
}
function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—'
}

export default function ProyectoDetalle() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
  })
  const { data: history } = useQuery<StageHistoryEntry[]>({
    queryKey: ['project', id, 'stage-history'],
    queryFn: async () => (await api.get(`/projects/${id}/stage-history`)).data,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({ resolver: zodResolver(editSchema) })

  const startEditing = () => {
    if (!project) return
    reset({
      name: project.name,
      description: project.description ?? '',
      category: project.category ?? '',
      ownerName: project.ownerName,
      sponsor: project.sponsor ?? '',
      riskLevel: project.riskLevel,
      kpiSummary: project.kpiSummary ?? '',
      dueDate: toDateInputValue(project.dueDate),
    })
    setEditing(true)
  }

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) => api.patch(`/projects/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditing(false)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/app/proyectos')
    },
  })

  if (isLoading) return <div className="p-6 text-[13px] text-muted">Cargando…</div>
  if (!project) return <div className="p-6 text-[13px] text-muted">Proyecto no encontrado.</div>

  const tasks = project.tasks ?? []
  const completedTasks = tasks.filter((t) => t.progressPct >= 100).length
  const avance = typeof project.progressPct === 'number'
    ? project.progressPct
    : tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progressPct, 0) / tasks.length)
      : 0

  const feasibility = project.feasibility ?? []
  const feasibilityAvg = feasibility.length > 0
    ? Math.round(feasibility.reduce((s, f) => s + f.score, 0) / feasibility.length)
    : null

  return (
    <div className="animate-viewin p-4 sm:p-6 max-w-[980px] mx-auto">
      <Link to="/app/proyectos" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink mb-4">
        <ArrowLeft size={14} /> Volver a Proyectos
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge color={STAGES[project.stage].color} bg="var(--surface-sunken)">{STAGES[project.stage].label}</Badge>
            <Badge color={RISK_META[project.riskLevel].color} bg={RISK_META[project.riskLevel].bg}>Riesgo {project.riskLevel.toLowerCase()}</Badge>
          </div>
          <h1 className="text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">{project.name}</h1>
        </div>
        {canManage && !editing && (
          <div className="flex gap-2">
            <button onClick={startEditing} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body hover:border-[var(--accent)] transition-colors">
              <Pencil size={13} /> Editar
            </button>
            <button onClick={() => setConfirmingDelete(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line bg-card text-[12.5px] font-semibold hover:border-[var(--accent)] transition-colors" style={{ color: 'var(--accent)' }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </div>
        )}
      </div>

      {confirmingDelete && (
        <div className="mb-5 p-4 rounded-card border" style={{ background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }}>
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle size={16} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
            <p className="text-[13px] text-body">
              ¿Confirmas eliminar definitivamente <strong>{project.name}</strong>? Esta acción no se puede deshacer y se perderán sus tareas y evaluaciones de factibilidad.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {deleteMutation.isPending ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="h-9 px-3.5 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body">
              Cancelar
            </button>
          </div>
          {deleteMutation.error && <p className="text-[11.5px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(deleteMutation.error)}</p>}
        </div>
      )}

      {editing ? (
        <div className="mb-5 bg-card border border-line rounded-card p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[14px] font-bold text-ink">Editar información general</h3>
            <button onClick={() => setEditing(false)} className="text-subtle hover:text-ink"><X size={16} /></button>
          </div>
          {updateMutation.error && <p className="text-[12px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(updateMutation.error)}</p>}
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[11px] text-subtle font-semibold">Nombre</span>
              <input {...register('name')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.name && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.name.message}</span>}
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[11px] text-subtle font-semibold">Descripción</span>
              <textarea {...register('description')} rows={3} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">Categoría</span>
              <input {...register('category')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">Responsable</span>
              <input {...register('ownerName')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
              {errors.ownerName && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.ownerName.message}</span>}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">Sponsor</span>
              <input {...register('sponsor')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">Riesgo</span>
              <select {...register('riskLevel')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]">
                <option value="BAJO">Bajo</option>
                <option value="MEDIO">Medio</option>
                <option value="ALTO">Alto</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">KPI resumen</span>
              <input {...register('kpiSummary')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-subtle font-semibold">Fecha estimada</span>
              <input type="date" {...register('dueDate')} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
            </label>
            <div className="sm:col-span-2 flex gap-2 mt-1">
              <button type="submit" disabled={updateMutation.isPending} className="h-9 px-4 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="h-9 px-4 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-card border border-line rounded-card p-5 mb-5">
          <Eyebrow>INFORMACIÓN GENERAL</Eyebrow>
          <p className="text-[13.5px] text-body leading-relaxed mt-2 mb-4">{project.description || 'Sin descripción registrada.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Categoría" value={project.category ?? '—'} />
            <Field label="Responsable" value={project.ownerName} />
            <Field label="Sponsor" value={project.sponsor ?? '—'} />
            <Field label="Fecha estimada" value={fmtDate(project.dueDate)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Avance */}
        <div className="bg-card border border-line rounded-card p-5">
          <Eyebrow>AVANCE</Eyebrow>
          <div className="flex items-center justify-between mt-2 mb-1.5">
            <span className="text-[13px] font-semibold text-body">Progreso general</span>
            <span className="font-mono text-[15px] font-bold" style={{ color: 'var(--accent)' }}>{avance}%</span>
          </div>
          <ProgressBar pct={avance} color={STAGES[project.stage].color} />
          <p className="text-[11.5px] text-subtle mt-2 mb-4">
            {tasks.length > 0 ? (
              `${completedTasks} de ${tasks.length} hitos cumplidos`
            ) : (
              <>Sin hitos registrados todavía (gestiónalos desde <Link to={`/app/gantt?proyecto=${project.id}`} className="font-semibold" style={{ color: 'var(--accent)' }}>Carta Gantt</Link>).</>
            )}
          </p>
          {tasks.length > 0 && (
            <div className="flex flex-col gap-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[12.5px]">
                  {t.progressPct >= 100 ? <CheckCircle2 size={14} style={{ color: 'var(--green-500)' }} /> : <Circle size={14} className="text-subtle" />}
                  <span className="text-body flex-1 truncate">{t.name}</span>
                  <span className="font-mono text-[11px] text-muted">{t.progressPct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Factibilidad */}
        <div className="bg-card border border-line rounded-card p-5">
          <Eyebrow>FACTIBILIDAD</Eyebrow>
          {feasibilityAvg !== null ? (
            <>
              <div className="flex items-center justify-between mt-2 mb-1.5">
                <span className="text-[13px] font-semibold text-body">Puntaje global</span>
                <span className="font-mono text-[15px] font-bold" style={{ color: 'var(--accent)' }}>{feasibilityAvg}/100</span>
              </div>
              <ProgressBar pct={feasibilityAvg} />
              <p className="text-[11.5px] text-subtle mt-2">{feasibility.length} criterio{feasibility.length === 1 ? '' : 's'} evaluado{feasibility.length === 1 ? '' : 's'}.</p>
            </>
          ) : (
            <p className="text-[12.5px] text-muted mt-2">Sin evaluación de factibilidad todavía.</p>
          )}
          <Link to="/app/factibilidad" className="inline-flex items-center gap-1 text-[12.5px] font-semibold mt-3" style={{ color: 'var(--accent)' }}>
            Ir a Factibilidad →
          </Link>
        </div>
      </div>

      {/* Línea de tiempo */}
      <div className="bg-card border border-line rounded-card p-5 mb-5">
        <Eyebrow>LÍNEA DE TIEMPO</Eyebrow>
        <div className="flex flex-col mt-3">
          {(!history || history.length === 0) && (
            <p className="text-[12.5px] text-muted">Sin transiciones de etapa registradas todavía.</p>
          )}
          {history?.map((h, i) => (
            <div key={h.id} className="flex gap-3 relative pb-4 last:pb-0">
              {i < history.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px" style={{ background: 'var(--border)' }} />}
              <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: STAGES[h.toStage].color }} />
              <div className="text-[13px] text-body leading-snug">
                {h.fromStage ? (
                  <>De <Dot color={STAGES[h.fromStage].color} size={6} /> <strong>{STAGES[h.fromStage].label}</strong> a </>
                ) : 'Creado en '}
                <strong>{STAGES[h.toStage].label}</strong>
                {h.changedByName && <span className="text-muted"> · {h.changedByName}</span>}
                <span className="text-muted text-[11.5px]"> · {timeAgo(h.createdAt)}</span>
                {h.note && <div className="text-muted text-[12px] mt-0.5">{h.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidencia (placeholder Fase 2) */}
      <div className="bg-card border border-line rounded-card p-5 flex items-center gap-3.5">
        <span className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center text-subtle shrink-0">
          <ImageIcon size={18} />
        </span>
        <div>
          <h3 className="text-[13.5px] font-bold text-ink">Evidencia y galería</h3>
          <p className="text-[12px] text-muted">Disponible en una próxima fase: fotografías, capturas, PDF y videos del proyecto.</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-[11.5px] text-subtle">
        <span className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center font-mono text-[9px] font-bold">{initials(project.ownerName)}</span>
        Responsable: {project.ownerName}{project.sponsor ? ` · Sponsor: ${project.sponsor}` : ''}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] text-subtle font-mono tracking-wide mb-0.5">{label.toUpperCase()}</div>
      <div className="text-[13px] text-ink font-semibold">{value}</div>
    </div>
  )
}
