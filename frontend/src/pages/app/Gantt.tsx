import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

interface ProjectRow { id: string; name: string }
interface Task {
  id: string
  name: string
  ownerInitials: string
  startOffsetDays: number
  durationDays: number
  progressPct: number
}

const ROW_COLORS = ['var(--blue-500)', 'var(--accent)', 'var(--violet-500)', 'var(--amber-500)', 'var(--green-500)', 'var(--slate-400)']

export default function Gantt() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: projects } = useQuery<ProjectRow[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  })
  const activeId = projectId ?? projects?.[0]?.id ?? null

  const { data: project } = useQuery<{ tasks: Task[] }>({
    queryKey: ['project', activeId],
    queryFn: async () => (await api.get(`/projects/${activeId}`)).data,
    enabled: !!activeId,
  })
  const tasks = project?.tasks ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', activeId] })

  const createTask = useMutation({
    mutationFn: (values: { name: string; ownerInitials: string; startOffsetDays: number; durationDays: number }) =>
      api.post(`/projects/${activeId}/tasks`, values),
    onSuccess: () => { invalidate(); setShowForm(false) },
  })
  const updateProgress = useMutation({
    mutationFn: (task: Task) =>
      api.patch(`/projects/${activeId}/tasks/${task.id}`, {
        name: task.name,
        ownerInitials: task.ownerInitials,
        startOffsetDays: task.startOffsetDays,
        durationDays: task.durationDays,
        progressPct: task.progressPct,
      }),
    onSuccess: invalidate,
  })

  const span = Math.max(30, ...tasks.map((t) => t.startOffsetDays + t.durationDays), 0)
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((span / 5) * i))

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <Eyebrow>CRONOGRAMA</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">Carta Gantt</h1>
        </div>
        <div className="flex gap-2 items-center">
          <select value={activeId ?? ''} onChange={(e) => setProjectId(e.target.value)} className="h-9 px-3 rounded-md border border-line bg-card text-[12.5px] text-body">
            {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {canManage && activeId && (
            <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-white font-semibold text-[12.5px]" style={{ background: 'var(--accent)' }}>
              <Plus size={14} /> Hito
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form
          className="bg-card border border-line rounded-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-5 gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            const f = e.currentTarget
            createTask.mutate({
              name: (f.elements.namedItem('name') as HTMLInputElement).value,
              ownerInitials: (f.elements.namedItem('ownerInitials') as HTMLInputElement).value,
              startOffsetDays: Number((f.elements.namedItem('startOffsetDays') as HTMLInputElement).value),
              durationDays: Number((f.elements.namedItem('durationDays') as HTMLInputElement).value),
            })
          }}
        >
          <input name="name" placeholder="Nombre del hito" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" required />
          <input name="ownerInitials" placeholder="Iniciales" maxLength={3} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
          <input name="startOffsetDays" type="number" placeholder="Día inicio" defaultValue={0} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
          <input name="durationDays" type="number" placeholder="Duración (días)" defaultValue={14} min={1} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
          <button type="submit" disabled={createTask.isPending} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] sm:col-span-5 sm:w-fit disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            {createTask.isPending ? 'Creando…' : 'Agregar'}
          </button>
          {createTask.error && <p className="text-[11px] sm:col-span-5" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createTask.error)}</p>}
        </form>
      )}

      {!activeId && <p className="text-[13px] text-muted">No hay proyectos creados todavía.</p>}

      {activeId && (
        <div className="overflow-x-auto">
          <div className="bg-card border border-line rounded-card overflow-hidden min-w-[760px]">
            <div className="flex border-b border-line bg-inset">
              <div className="w-[230px] shrink-0 px-4 py-3 font-mono text-[10px] tracking-[0.1em] text-subtle">HITO / TAREA</div>
              <div className="flex-1 flex">
                {ticks.map((t) => (
                  <div key={t} className="flex-1 py-3 text-center font-mono text-[11px] text-muted border-l border-line">
                    Día {t}
                  </div>
                ))}
              </div>
            </div>
            {tasks.length === 0 && <p className="p-5 text-[12.5px] text-muted">Sin hitos registrados para este proyecto.</p>}
            {tasks.map((t, i) => (
              <div key={t.id} className="flex items-center border-b border-line last:border-0">
                <div className="w-[230px] shrink-0 px-4 py-3 flex items-center gap-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[9px] font-bold font-mono">{t.ownerInitials}</span>
                  <span className="text-[13px] text-ink font-medium leading-tight">{t.name}</span>
                </div>
                <div className="flex-1 relative h-[42px] border-l border-line">
                  <div
                    className="absolute top-2.5 h-[22px] rounded-[7px] bg-sunken overflow-hidden border border-line"
                    style={{ left: `${(t.startOffsetDays / span) * 100}%`, width: `${(t.durationDays / span) * 100}%` }}
                  >
                    <div className="h-full rounded-md" style={{ width: `${t.progressPct}%`, background: ROW_COLORS[i % ROW_COLORS.length] }} />
                  </div>
                  {canManage ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={t.progressPct}
                      onBlur={(e) => updateProgress.mutate({ ...t, progressPct: Number(e.target.value) })}
                      className="absolute top-[13px] w-12 bg-transparent border-none outline-none font-mono text-[10.5px] font-semibold"
                      style={{ left: `calc(${((t.startOffsetDays + t.durationDays) / span) * 100}% + 8px)`, color: ROW_COLORS[i % ROW_COLORS.length] }}
                    />
                  ) : (
                    t.progressPct > 0 && (
                      <span
                        className="absolute top-[15px] font-mono text-[10.5px] font-semibold whitespace-nowrap"
                        style={{ left: `calc(${((t.startOffsetDays + t.durationDays) / span) * 100}% + 8px)`, color: ROW_COLORS[i % ROW_COLORS.length] }}
                      >
                        {t.progressPct}%
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
