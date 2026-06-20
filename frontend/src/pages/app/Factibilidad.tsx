import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Eyebrow, ProgressBar } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

interface ProjectRow { id: string; name: string }
interface FeasibilityCriterion { criterionName: string; score: number }
interface ProjectDetail extends ProjectRow {
  feasibility: FeasibilityCriterion[]
}

const CRITERION_COLORS = ['var(--green-500)', 'var(--blue-500)', 'var(--amber-500)', 'var(--violet-500)', 'var(--accent)', 'var(--blue-600)']

function verdict(score: number) {
  if (score >= 70) return { label: 'Factible — recomendado a piloto', tone: 'var(--green-600)', bg: 'var(--green-50)', border: 'var(--green-100)' }
  if (score >= 40) return { label: 'En revisión — requiere ajustes', tone: 'var(--amber-600)', bg: 'var(--amber-50)', border: 'var(--amber-100)' }
  return { label: 'No factible en su forma actual', tone: 'var(--accent-700)', bg: 'var(--accent-50)', border: 'var(--accent-100)' }
}

export default function Factibilidad() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [rows, setRows] = useState<FeasibilityCriterion[]>([])

  const { data: projects } = useQuery<ProjectRow[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  })
  const activeId = projectId ?? projects?.[0]?.id ?? null

  const { data: project } = useQuery<ProjectDetail>({
    queryKey: ['project', activeId],
    queryFn: async () => (await api.get(`/projects/${activeId}`)).data,
    enabled: !!activeId,
  })

  useEffect(() => {
    if (project) setRows(project.feasibility.map((f) => ({ criterionName: f.criterionName, score: f.score })))
  }, [project])

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/projects/${activeId}/feasibility`, { criteria: rows }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', activeId] }),
  })

  const total = rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length)
  const v = verdict(total)

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5.5 mb-6">
        <div>
          <Eyebrow>ASISTENTE DE EVALUACIÓN</Eyebrow>
          <h1 className="mt-1.5 mb-1 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Ficha de factibilidad
          </h1>
        </div>
        <select
          value={activeId ?? ''}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 px-3 rounded-md border border-line bg-card text-[12.5px] text-body"
        >
          {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!activeId && <p className="text-[13px] text-muted">No hay proyectos creados todavía. Crea uno en Portafolio.</p>}

      {activeId && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4.5 gap-5 items-start">
          {/* Indicadores */}
          <div className="bg-card border border-line rounded-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base text-ink font-bold">Indicadores de evaluación</h3>
              {canManage && (
                <button
                  onClick={() => setRows((r) => [...r, { criterionName: 'Nuevo criterio', score: 50 }])}
                  className="text-[12px] font-semibold inline-flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <Plus size={14} /> Agregar criterio
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4.5 gap-5">
              {rows.length === 0 && <p className="text-[12.5px] text-muted">Sin criterios evaluados todavía.</p>}
              {rows.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    {canManage ? (
                      <input
                        value={c.criterionName}
                        onChange={(e) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, criterionName: e.target.value } : row)))}
                        className="text-[13.5px] text-body font-medium bg-transparent border-none outline-none flex-1"
                      />
                    ) : (
                      <span className="text-[13.5px] text-body font-medium">{c.criterionName}</span>
                    )}
                    <span className="font-mono text-[13px] font-bold flex items-center gap-1" style={{ color: CRITERION_COLORS[i % CRITERION_COLORS.length] }}>
                      {canManage ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={c.score}
                          onChange={(e) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, score: Number(e.target.value) } : row)))}
                          className="w-12 bg-transparent border-none outline-none text-right font-mono"
                        />
                      ) : c.score}
                      <span className="text-subtle font-normal">/100</span>
                      {canManage && (
                        <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} className="text-subtle hover:text-[var(--accent)]">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </span>
                  </div>
                  <ProgressBar pct={c.score} color={CRITERION_COLORS[i % CRITERION_COLORS.length]} />
                </div>
              ))}
            </div>
            {canManage && (
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full mt-5 h-10 rounded-[10px] text-white font-bold text-sm disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {saveMutation.isPending ? 'Guardando…' : 'Guardar evaluación'}
              </button>
            )}
            {saveMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveMutation.error)}</p>}
          </div>

          {/* Puntaje global */}
          <div className="bg-card border border-line rounded-card p-6 sm:p-7 text-center">
            <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-4.5 mb-5">PUNTAJE GLOBAL</div>
            <div
              className="w-[140px] h-[140px] rounded-full mx-auto flex items-center justify-center relative"
              style={{ background: `conic-gradient(var(--accent) 0 ${total}%, var(--surface-sunken) ${total}% 100%)` }}
            >
              <div className="w-[108px] h-[108px] rounded-full bg-card flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-bold text-ink leading-none">{total}</span>
                <span className="text-[11px] text-muted">de 100</span>
              </div>
            </div>
            <div className="mt-5 p-3 rounded-[11px]" style={{ background: v.bg, border: `1px solid ${v.border}` }}>
              <div className="text-sm font-bold" style={{ color: v.tone }}>{v.label}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
