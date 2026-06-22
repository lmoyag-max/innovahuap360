import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  ClipboardCheck, Layers, CheckCircle2, AlertTriangle, XCircle, Clock3, Plus, Building2,
} from 'lucide-react'
import { Eyebrow, Kpi, Badge, EmptyState, Modal } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { ScoreRadial } from './factibilidad/components/ScoreRadial'

interface ProjectRow { id: string; name: string }
interface FichaSummary {
  id: string
  name: string
  evaluationDate: string
  responsibleName: string
  status: 'BORRADOR' | 'EN_EVALUACION' | 'FINALIZADA'
  result: 'FACTIBLE' | 'FACTIBLE_CON_OBSERVACIONES' | 'REQUIERE_MAYOR_ANALISIS' | 'NO_FACTIBLE' | null
  globalScore: number | null
  updatedAt: string
}
interface Summary {
  totalFichas: number
  proyectosEvaluados: number
  factibles: number
  factiblesConObservaciones: number
  noFactibles: number
  pendientes: number
}

const STATUS_META = {
  BORRADOR: { label: 'Borrador', color: 'var(--slate-500)', bg: 'var(--slate-100)' },
  EN_EVALUACION: { label: 'En evaluación', color: 'var(--blue-600)', bg: 'var(--blue-50)' },
  FINALIZADA: { label: 'Finalizada', color: 'var(--green-600)', bg: 'var(--green-50)' },
} as const
const RESULT_META = {
  FACTIBLE: { label: 'Factible', color: 'var(--green-600)', bg: 'var(--green-50)' },
  FACTIBLE_CON_OBSERVACIONES: { label: 'Con observaciones', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  REQUIERE_MAYOR_ANALISIS: { label: 'Requiere análisis', color: 'var(--blue-600)', bg: 'var(--blue-50)' },
  NO_FACTIBLE: { label: 'No factible', color: 'var(--accent-700)', bg: 'var(--accent-50)' },
} as const

export default function Factibilidad() {
  const { hasPermission } = useAuth()
  const navigate = useNavigate()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [showNewFicha, setShowNewFicha] = useState(false)

  const { data: summary } = useQuery<Summary>({
    queryKey: ['factibilidad-summary'],
    queryFn: async () => (await api.get('/factibilidad/summary')).data,
  })
  const { data: projects } = useQuery<ProjectRow[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  })
  const activeId = projectId ?? projects?.[0]?.id ?? null

  const { data: fichas, isLoading: loadingFichas } = useQuery<FichaSummary[]>({
    queryKey: ['factibilidad-fichas', activeId],
    queryFn: async () => (await api.get('/factibilidad/fichas', { params: { projectId: activeId } })).data,
    enabled: !!activeId,
  })

  const latest = fichas?.[0]

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-card mb-5 px-5 sm:px-7 py-6 sm:py-7" style={{ background: 'linear-gradient(125deg,var(--slate-900),var(--slate-800) 60%,var(--accent-700))' }}>
        <span className="absolute -right-10 -top-14 w-[220px] h-[220px] rounded-full opacity-25 blur-[60px]" style={{ background: 'var(--accent)' }} />
        <span className="absolute left-[18%] -bottom-20 w-[180px] h-[180px] rounded-full opacity-15 blur-[55px]" style={{ background: 'var(--blue-500)' }} />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.7) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] px-3 py-1 rounded-full border" style={{ color: '#ffb3b6', background: 'rgba(237,29,37,.18)', borderColor: 'rgba(237,29,37,.36)' }}>
              <ClipboardCheck size={11} /> GESTIÓN DE FACTIBILIDAD
            </span>
            <h1 className="mt-2.5 text-[22px] sm:text-[27px] text-white tracking-tight font-extrabold">
              Evaluación técnica de proyectos
            </h1>
            <p className="mt-1.5 text-[13px] text-white/65 max-w-[560px]">
              Fichas de factibilidad técnica, operacional, económica y normativa para sustentar el avance de cada iniciativa.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <Kpi value={String(summary?.totalFichas ?? '—')} label="Total de fichas" icon={<Layers size={16} />} accentBar="var(--accent)" />
        <Kpi value={String(summary?.proyectosEvaluados ?? '—')} label="Proyectos evaluados" icon={<Building2 size={16} />} accentBar="var(--blue-500)" />
        <Kpi value={String(summary?.factibles ?? '—')} label="Factibles" icon={<CheckCircle2 size={16} />} accentBar="var(--green-500)" />
        <Kpi value={String(summary?.factiblesConObservaciones ?? '—')} label="Con observaciones" icon={<AlertTriangle size={16} />} accentBar="var(--amber-500)" />
        <Kpi value={String(summary?.noFactibles ?? '—')} label="No factibles" icon={<XCircle size={16} />} accentBar="var(--accent-700)" />
        <Kpi value={String(summary?.pendientes ?? '—')} label="Pendientes" icon={<Clock3 size={16} />} accentBar="var(--slate-400)" />
      </div>

      {/* Selector de proyecto + nueva ficha */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2.5">
          <span className="text-[12px] font-semibold text-body inline-flex items-center gap-1.5"><Building2 size={14} className="text-subtle" /> Proyecto</span>
          <select
            value={activeId ?? ''}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-10 px-3 rounded-md border border-line bg-card text-[13px] text-body min-w-[260px]"
          >
            {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        {canManage && activeId && (
          <button
            onClick={() => setShowNewFicha(true)}
            className="h-10 px-4 rounded-md text-white font-bold text-[12.5px] inline-flex items-center gap-1.5 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={15} /> Nueva ficha
          </button>
        )}
      </div>

      {!activeId && <p className="text-[13px] text-muted">No hay proyectos creados todavía. Crea uno en Proyectos.</p>}

      {activeId && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
          <div>
            {/* Resumen */}
            <div className="bg-card border border-line rounded-card p-5 mb-4">
              <Eyebrow>RESUMEN DE FACTIBILIDAD</Eyebrow>
              {latest ? (
                <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
                  <div>
                    <div className="text-[15px] font-bold text-ink">{latest.name}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge color={STATUS_META[latest.status].color} bg={STATUS_META[latest.status].bg}>{STATUS_META[latest.status].label.toUpperCase()}</Badge>
                      {latest.result && <Badge color={RESULT_META[latest.result].color} bg={RESULT_META[latest.result].bg}>{RESULT_META[latest.result].label.toUpperCase()}</Badge>}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[12.5px] text-muted mt-2">Este proyecto aún no tiene fichas de factibilidad registradas.</p>
              )}
            </div>

            {/* Lista de fichas */}
            <div className="bg-card border border-line rounded-card p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-[14px] font-bold text-ink">Fichas registradas</h3>
              </div>
              {loadingFichas && <p className="text-[12.5px] text-muted">Cargando…</p>}
              {!loadingFichas && (!fichas || fichas.length === 0) && (
                <EmptyState
                  icon={<ClipboardCheck size={20} />}
                  title="Sin fichas registradas"
                  description="Crea la primera ficha de factibilidad para este proyecto."
                  action={canManage ? (
                    <button onClick={() => setShowNewFicha(true)} className="h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
                      <Plus size={14} /> Nueva ficha
                    </button>
                  ) : undefined}
                />
              )}
              <div className="flex flex-col gap-2.5">
                {fichas?.map((f) => (
                  <Link
                    key={f.id}
                    to={`/app/factibilidad/${f.id}`}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-[10px] border border-line transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover bg-card"
                  >
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-ink truncate">{f.name}</div>
                      <div className="text-[11.5px] text-muted mt-0.5">
                        {new Date(f.evaluationDate).toLocaleDateString('es-CL')} · {f.responsibleName}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge color={STATUS_META[f.status].color} bg={STATUS_META[f.status].bg}>{STATUS_META[f.status].label}</Badge>
                      {f.result && <Badge color={RESULT_META[f.result].color} bg={RESULT_META[f.result].bg}>{RESULT_META[f.result].label}</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Puntaje global */}
          <div className="bg-card border border-line rounded-card p-6 text-center">
            <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-4">ÚLTIMA EVALUACIÓN</div>
            <ScoreRadial score={latest?.globalScore ?? null} />
            {latest?.result && (
              <div className="mt-5 p-3 rounded-[11px]" style={{ background: RESULT_META[latest.result].bg, border: `1px solid ${RESULT_META[latest.result].color}22` }}>
                <div className="text-sm font-bold" style={{ color: RESULT_META[latest.result].color }}>{RESULT_META[latest.result].label}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewFicha && activeId && (
        <NewFichaModal
          projectId={activeId}
          onClose={() => setShowNewFicha(false)}
          onCreated={(fichaId) => {
            setShowNewFicha(false)
            queryClient.invalidateQueries({ queryKey: ['factibilidad-fichas', activeId] })
            queryClient.invalidateQueries({ queryKey: ['factibilidad-summary'] })
            navigate(`/app/factibilidad/${fichaId}`)
          }}
        />
      )}
    </div>
  )
}

interface NewFichaValues { name: string; evaluationDate: string; responsibleName: string; evaluationObjective?: string }

function NewFichaModal({ projectId, onClose, onCreated }: { projectId: string; onClose: () => void; onCreated: (fichaId: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<NewFichaValues>({
    defaultValues: { evaluationDate: new Date().toISOString().slice(0, 10) },
  })

  const createMutation = useMutation({
    mutationFn: (values: NewFichaValues) => api.post('/factibilidad/fichas', { ...values, projectId }),
    onSuccess: (res) => onCreated(res.data.id),
  })

  return (
    <Modal open onClose={onClose} title="Nueva ficha de factibilidad" maxWidth={480}>
      <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-subtle font-semibold">Nombre de la ficha</span>
          <input {...register('name', { required: 'Requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" placeholder="Ej. Evaluación inicial — Tótem de autoatención" />
          {errors.name && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.name.message}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-subtle font-semibold">Fecha de evaluación</span>
          <input type="date" {...register('evaluationDate', { required: true })} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-subtle font-semibold">Responsable</span>
          <input {...register('responsibleName', { required: 'Requerido' })} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          {errors.responsibleName && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{errors.responsibleName.message}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-subtle font-semibold">Objetivo de la evaluación (opcional)</span>
          <textarea {...register('evaluationObjective')} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
        </label>
        {createMutation.error && <p className="text-[12px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
        <div className="flex gap-2 mt-1">
          <button type="submit" disabled={createMutation.isPending} className="h-10 px-4 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            {createMutation.isPending ? 'Creando…' : 'Crear ficha'}
          </button>
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}
