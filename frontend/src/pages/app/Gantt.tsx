import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Search, GripVertical, AlertTriangle, X, Trash2, Pencil, Paperclip,
  History as HistoryIcon, Link2, Download, Star, ZoomIn,
} from 'lucide-react'
import { Eyebrow, Badge, Dot, Modal, EmptyState, Tooltip, Kpi } from '../../components/ui'
import { api, apiErrorMessage, downloadUpload } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { timeAgo } from '../../lib/stages'
import {
  TASK_STATUS_META, TASK_PRIORITY_META, TASK_STATUS_ORDER, TASK_PRIORITY_ORDER,
  type ProjectTaskType, type ProjectTaskStatus, type ProjectTaskPriority,
} from '../../lib/ganttMeta'

interface ProjectRow { id: string; name: string }
interface UploadRef { id: string; originalName: string; mimeType: string; sizeBytes: number }
interface Attachment { id: string; uploadId: string; upload: UploadRef }
interface DependsOnRef { dependsOnId: string; dependsOn: { id: string; name: string } }
interface HistoryEntry {
  id: string
  changedByName: string | null
  field: string
  fromValue: string | null
  toValue: string | null
  createdAt: string
}
interface Task {
  id: string
  name: string
  description: string | null
  ownerInitials: string
  responsibleName: string | null
  startOffsetDays: number
  durationDays: number
  progressPct: number
  sortOrder: number
  type: ProjectTaskType
  status: ProjectTaskStatus
  priority: ProjectTaskPriority
  isCritical: boolean
  observations: string | null
  dependsOn: DependsOnRef[]
  attachments: Attachment[]
}
interface ProjectDetail { id: string; name: string; startDate: string | null; dueDate: string | null; tasks: Task[] }

type Zoom = 'dia' | 'semana' | 'mes'
const ZOOM_PX: Record<Zoom, number> = { dia: 34, semana: 12, mes: 4 }
const ZOOM_STEP: Record<Zoom, number> = { dia: 1, semana: 7, mes: 30 }
const ZOOM_OPTIONS: { key: Zoom; label: string }[] = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
]
const ROW_HEIGHT = 52
const LABEL_COL_WIDTH = 260

const FIELD_LABELS: Record<string, string> = {
  status: 'Estado',
  progressPct: 'Avance',
  startOffsetDays: 'Día de inicio',
  durationDays: 'Duración',
  priority: 'Prioridad',
  creado: 'Creación',
  eliminado: 'Eliminación',
}

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('es-CL') : '—'
}
function addDays(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
function isOverdue(task: Task, projectStartDate: string | null) {
  if (task.status === 'COMPLETADO' || task.status === 'CANCELADO') return false
  if (task.status === 'ATRASADO') return true
  if (!projectStartDate) return false
  return addDays(projectStartDate, task.startOffsetDays + task.durationDays).getTime() < Date.now()
}
function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '—'
}

export default function Gantt() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const canDelete = hasPermission('projects.tasks.delete')
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [projectId, setProjectId] = useState<string | null>(searchParams.get('proyecto'))
  const [zoom, setZoom] = useState<Zoom>('semana')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectTaskStatus | 'TODOS'>('TODOS')
  const [priorityFilter, setPriorityFilter] = useState<ProjectTaskPriority | 'TODAS'>('TODAS')
  const [responsibleFilter, setResponsibleFilter] = useState<string>('TODOS')
  const [createType, setCreateType] = useState<ProjectTaskType | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

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
  const tasks = project?.tasks ?? []
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', activeId] })

  const responsibleOptions = useMemo(() => {
    const names = new Set(tasks.map((t) => t.responsibleName || t.ownerInitials))
    return Array.from(names)
  }, [tasks])

  const filtersActive = !!search.trim() || statusFilter !== 'TODOS' || priorityFilter !== 'TODAS' || responsibleFilter !== 'TODOS'

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (statusFilter !== 'TODOS' && t.status !== statusFilter) return false
      if (priorityFilter !== 'TODAS' && t.priority !== priorityFilter) return false
      if (responsibleFilter !== 'TODOS' && (t.responsibleName || t.ownerInitials) !== responsibleFilter) return false
      if (term && !`${t.name} ${t.description ?? ''}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [tasks, search, statusFilter, priorityFilter, responsibleFilter])

  const summary = useMemo(() => {
    const totalHitos = tasks.filter((t) => t.type === 'HITO').length
    const tareasActivas = tasks.filter((t) => t.status !== 'COMPLETADO' && t.status !== 'CANCELADO').length
    const tareasAtrasadas = tasks.filter((t) => isOverdue(t, project?.startDate ?? null)).length
    const avancePromedio = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.progressPct, 0) / tasks.length) : 0
    const hitosCriticos = tasks.filter((t) => t.isCritical).length
    const fechaEstimada = project?.dueDate
      ? fmtDate(project.dueDate)
      : project?.startDate && tasks.length > 0
        ? fmtDate(addDays(project.startDate, Math.max(...tasks.map((t) => t.startOffsetDays + t.durationDays))).toISOString())
        : '—'
    return { totalHitos, tareasActivas, tareasAtrasadas, avancePromedio, hitosCriticos, fechaEstimada }
  }, [tasks, project])

  const span = Math.max(60, ...tasks.map((t) => t.startOffsetDays + t.durationDays), 0)
  const pxPerDay = ZOOM_PX[zoom]
  const chartWidth = span * pxPerDay
  const ticks: number[] = []
  for (let i = 0; i <= span; i += ZOOM_STEP[zoom]) ticks.push(i)

  const createTask = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post(`/projects/${activeId}/tasks`, values),
    onSuccess: () => { invalidate(); setCreateType(null) },
  })
  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.patch(`/projects/${activeId}/tasks/reorder`, { ids }),
    onSuccess: invalidate,
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filteredTasks.findIndex((t) => t.id === active.id)
    const newIndex = filteredTasks.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(filteredTasks, oldIndex, newIndex)
    reorderMutation.mutate(reordered.map((t) => t.id))
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <Eyebrow>CRONOGRAMA</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">Carta Gantt</h1>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={activeId ?? ''}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 px-3 rounded-md border border-line bg-card text-[12.5px] text-body"
          >
            {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {canManage && activeId && (
            <>
              <button
                onClick={() => setCreateType('HITO')}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body hover:border-[var(--accent)] transition-colors"
              >
                <Plus size={14} /> Nuevo hito
              </button>
              <button
                onClick={() => setCreateType('TAREA')}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-white font-semibold text-[12.5px]"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={14} /> Nueva tarea
              </button>
            </>
          )}
        </div>
      </div>

      {activeId && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <Kpi value={String(summary.totalHitos)} label="Total de hitos" accentBar="var(--violet-500)" />
          <Kpi value={String(summary.tareasActivas)} label="Tareas activas" accentBar="var(--blue-500)" />
          <Kpi value={String(summary.tareasAtrasadas)} label="Tareas atrasadas" accentBar="var(--red-500)" />
          <Kpi value={`${summary.avancePromedio}%`} label="Avance promedio" accentBar="var(--green-500)" />
          <Kpi value={summary.fechaEstimada} label="Fecha estimada de término" accentBar="var(--slate-400)" />
          <Kpi value={String(summary.hitosCriticos)} label="Hitos críticos" accentBar="var(--amber-500)" />
        </div>
      )}

      {summary.tareasAtrasadas > 0 && (
        <div className="mb-4 p-3 rounded-card border flex items-center gap-2.5" style={{ background: 'var(--red-50)', borderColor: 'var(--red-50)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--red-600)' }} className="shrink-0" />
          <p className="text-[12.5px] text-body">
            <strong>{summary.tareasAtrasadas}</strong> {summary.tareasAtrasadas === 1 ? 'hito/tarea está atrasado' : 'hitos/tareas están atrasados'} respecto a su fecha estimada.
          </p>
        </div>
      )}

      {activeId && tasks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar hito o tarea…"
              className="w-full h-9 pl-8 pr-3 rounded-md border border-line bg-inset text-[12.5px] outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectTaskStatus | 'TODOS')} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] text-body">
            <option value="TODOS">Todos los estados</option>
            {TASK_STATUS_ORDER.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as ProjectTaskPriority | 'TODAS')} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] text-body">
            <option value="TODAS">Toda prioridad</option>
            {TASK_PRIORITY_ORDER.map((p) => <option key={p} value={p}>{TASK_PRIORITY_META[p].label}</option>)}
          </select>
          <select value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] text-body">
            <option value="TODOS">Todo responsable</option>
            {responsibleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="ml-auto inline-flex rounded-md border border-line bg-card p-0.5 gap-0.5">
            <ZoomIn size={13} className="self-center ml-1.5 text-subtle" />
            {ZOOM_OPTIONS.map((z) => (
              <button
                key={z.key}
                onClick={() => setZoom(z.key)}
                className="h-8 px-2.5 rounded-[6px] text-[12px] font-semibold transition-colors"
                style={zoom === z.key ? { background: 'var(--accent-50)', color: 'var(--accent)' } : { color: 'var(--text-muted)' }}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {createType && (
        <CreateTaskForm
          type={createType}
          onCancel={() => setCreateType(null)}
          onSubmit={(values) => createTask.mutate(values)}
          isPending={createTask.isPending}
          error={createTask.error}
        />
      )}

      {!activeId && <p className="text-[13px] text-muted">No hay proyectos creados todavía.</p>}

      {activeId && tasks.length === 0 && !createType && (
        <EmptyState
          icon={<Plus size={26} />}
          title="Sin hitos ni tareas registradas"
          description="Crea el primer hito o tarea de este proyecto para comenzar a planificar su cronograma."
          action={canManage && (
            <button onClick={() => setCreateType('HITO')} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px]" style={{ background: 'var(--accent)' }}>
              <Plus size={14} /> Nuevo hito
            </button>
          )}
        />
      )}

      {activeId && tasks.length > 0 && (
        <div className="overflow-x-auto">
          <div className="bg-card border border-line rounded-card overflow-hidden" style={{ minWidth: LABEL_COL_WIDTH + chartWidth }}>
            <div className="flex border-b border-line bg-inset">
              <div className="shrink-0 px-4 py-3 font-mono text-[10px] tracking-[0.1em] text-subtle" style={{ width: LABEL_COL_WIDTH }}>
                HITO / TAREA {filteredTasks.length !== tasks.length && `(${filteredTasks.length}/${tasks.length})`}
              </div>
              <div className="relative" style={{ width: chartWidth, height: 38 }}>
                {ticks.map((t) => (
                  <div
                    key={t}
                    className="absolute top-0 bottom-0 border-l border-line flex items-start pl-1.5 pt-2.5 font-mono text-[10px] text-muted whitespace-nowrap"
                    style={{ left: t * pxPerDay }}
                  >
                    {project?.startDate ? fmtDate(addDays(project.startDate, t).toISOString()) : `Día ${t}`}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <DependencyLines tasks={filteredTasks} pxPerDay={pxPerDay} labelColWidth={LABEL_COL_WIDTH} rowHeight={ROW_HEIGHT} />
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {filteredTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      span={span}
                      pxPerDay={pxPerDay}
                      labelColWidth={LABEL_COL_WIDTH}
                      canDrag={canManage && !filtersActive}
                      overdue={isOverdue(t, project?.startDate ?? null)}
                      onOpen={() => setSelectedTaskId(t.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {filteredTasks.length === 0 && (
                <p className="p-5 text-[12.5px] text-muted">Ningún hito/tarea coincide con los filtros actuales.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && project && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          allTasks={tasks}
          canManage={canManage}
          canDelete={canDelete}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  )
}

/* ================= Fila de la tabla / barra ================= */

function TaskRow({
  task, span, pxPerDay, labelColWidth, canDrag, overdue, onOpen,
}: {
  task: Task
  span: number
  pxPerDay: number
  labelColWidth: number
  canDrag: boolean
  overdue: boolean
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canDrag })
  const style = { transform: CSS.Transform.toString(transform), transition, height: ROW_HEIGHT }
  const statusMeta = TASK_STATUS_META[task.status]
  const responsible = task.responsibleName || task.ownerInitials

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      className="flex items-center border-b border-line last:border-0 hover:bg-hover transition-colors data-[dragging=true]:opacity-60"
    >
      <div className="shrink-0 px-3 flex items-center gap-2 cursor-pointer" style={{ width: labelColWidth }} onClick={onOpen}>
        {canDrag && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-subtle hover:text-ink cursor-grab active:cursor-grabbing shrink-0"
            title="Arrastrar para reordenar"
          >
            <GripVertical size={14} />
          </button>
        )}
        <span className="w-6 h-6 shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[9px] font-bold font-mono" title={responsible}>
          {initialsOf(responsible)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {task.isCritical && <Tooltip label="Hito crítico"><Star size={11} fill="var(--amber-500)" style={{ color: 'var(--amber-500)' }} /></Tooltip>}
            <span className="text-[12.5px] text-ink font-medium leading-tight truncate">{task.name}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Badge color={statusMeta.color} bg={statusMeta.bg} className="!text-[9px] !px-1.5">{statusMeta.label}</Badge>
            {overdue && task.status !== 'ATRASADO' && <Dot color="var(--red-500)" size={6} />}
          </div>
        </div>
      </div>
      <div className="relative flex-1 h-full border-l border-line cursor-pointer" style={{ width: span * pxPerDay }} onClick={onOpen}>
        <TaskBar task={task} pxPerDay={pxPerDay} />
      </div>
    </div>
  )
}

function TaskBar({ task, pxPerDay }: { task: Task; pxPerDay: number }) {
  const meta = TASK_STATUS_META[task.status]
  const left = task.startOffsetDays * pxPerDay
  const title = `${task.name} · ${meta.label} · ${task.progressPct}%`

  if (task.type === 'HITO') {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2"
        style={{ left, background: meta.bg, borderColor: meta.color }}
        title={title}
      />
    )
  }
  const width = Math.max(task.durationDays * pxPerDay, 14)
  return (
    <div
      className="absolute top-2.5 h-[22px] rounded-[7px] overflow-hidden border"
      style={{ left, width, background: meta.bg, borderColor: meta.color }}
      title={title}
    >
      <div className="h-full" style={{ width: `${task.progressPct}%`, background: meta.color }} />
    </div>
  )
}

/** Líneas SVG simples entre el fin de una tarea y el inicio de las que dependen de ella. */
function DependencyLines({
  tasks, pxPerDay, labelColWidth, rowHeight,
}: {
  tasks: Task[]
  pxPerDay: number
  labelColWidth: number
  rowHeight: number
}) {
  const indexById = new Map(tasks.map((t, i) => [t.id, i]))
  const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = []
  tasks.forEach((task, i) => {
    task.dependsOn.forEach((dep) => {
      const fromIndex = indexById.get(dep.dependsOnId)
      if (fromIndex === undefined) return
      const fromTask = tasks[fromIndex]
      const x1 = labelColWidth + (fromTask.startOffsetDays + fromTask.durationDays) * pxPerDay
      const y1 = fromIndex * rowHeight + rowHeight / 2
      const x2 = labelColWidth + task.startOffsetDays * pxPerDay
      const y2 = i * rowHeight + rowHeight / 2
      lines.push({ x1, y1, x2, y2, key: `${dep.dependsOnId}-${task.id}` })
    })
  })
  if (lines.length === 0) return null
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: tasks.length * rowHeight, zIndex: 1 }}>
      {lines.map((l) => (
        <path
          key={l.key}
          d={`M ${l.x1} ${l.y1} C ${l.x1 + 16} ${l.y1}, ${l.x2 - 16} ${l.y2}, ${l.x2} ${l.y2}`}
          fill="none"
          stroke="var(--slate-300)"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
      ))}
    </svg>
  )
}

/* ================= Formulario de creación ================= */

function CreateTaskForm({
  type, onCancel, onSubmit, isPending, error,
}: {
  type: ProjectTaskType
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => void
  isPending: boolean
  error: unknown
}) {
  return (
    <form
      className="bg-card border border-line rounded-card p-4 mb-4"
      onSubmit={(e) => {
        e.preventDefault()
        const f = e.currentTarget
        const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value
        onSubmit({
          type,
          name: get('name'),
          ownerInitials: get('ownerInitials'),
          responsibleName: get('responsibleName') || undefined,
          startOffsetDays: Number(get('startOffsetDays')),
          durationDays: Number(get('durationDays')),
          priority: get('priority'),
          description: get('description') || undefined,
        })
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-ink">{type === 'HITO' ? 'Nuevo hito' : 'Nueva tarea'}</span>
        <button type="button" onClick={onCancel} className="text-subtle hover:text-ink"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
        <input name="name" placeholder="Nombre" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" required />
        <input name="responsibleName" placeholder="Responsable (nombre)" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" />
        <input name="ownerInitials" placeholder="Iniciales" maxLength={3} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
        <select name="priority" defaultValue="MEDIA" className="h-9 px-2.5 rounded-md border border-line bg-inset text-[13px]">
          {TASK_PRIORITY_ORDER.map((p) => <option key={p} value={p}>{TASK_PRIORITY_META[p].label}</option>)}
        </select>
        <input name="startOffsetDays" type="number" placeholder="Día inicio" defaultValue={0} min={0} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
        <input name="durationDays" type="number" placeholder="Duración (días)" defaultValue={type === 'HITO' ? 1 : 14} min={1} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
        <textarea name="description" placeholder="Descripción (opcional)" rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none sm:col-span-4" />
        <button type="submit" disabled={isPending} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] sm:col-span-2 disabled:opacity-60" style={{ background: 'var(--accent)' }}>
          {isPending ? 'Creando…' : 'Agregar'}
        </button>
      </div>
      {error != null && <p className="text-[11px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(error)}</p>}
    </form>
  )
}

/* ================= Modal de detalle ================= */

function TaskDetailModal({
  task, project, allTasks, canManage, canDelete, onClose,
}: {
  task: Task
  project: ProjectDetail
  allTasks: Task[]
  canManage: boolean
  canDelete: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [draft, setDraft] = useState({
    name: task.name,
    description: task.description ?? '',
    ownerInitials: task.ownerInitials,
    responsibleName: task.responsibleName ?? '',
    status: task.status,
    priority: task.priority,
    isCritical: task.isCritical,
    progressPct: task.progressPct,
    observations: task.observations ?? '',
    startOffsetDays: task.startOffsetDays,
    durationDays: task.durationDays,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project', project.id] })

  const updateMutation = useMutation({
    mutationFn: (values: typeof draft) => api.patch(`/projects/${project.id}/tasks/${task.id}`, values),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${project.id}/tasks/${task.id}`),
    onSuccess: () => { invalidate(); onClose() },
  })
  const addDependency = useMutation({
    mutationFn: (dependsOnId: string) => api.post(`/projects/${project.id}/tasks/${task.id}/dependencies`, { dependsOnId }),
    onSuccess: invalidate,
  })
  const removeDependency = useMutation({
    mutationFn: (dependsOnId: string) => api.delete(`/projects/${project.id}/tasks/${task.id}/dependencies/${dependsOnId}`),
    onSuccess: invalidate,
  })
  const addAttachment = useMutation({
    mutationFn: (uploadId: string) => api.post(`/projects/${project.id}/tasks/${task.id}/attachments`, { uploadId }),
    onSuccess: invalidate,
  })
  const removeAttachment = useMutation({
    mutationFn: (attachmentId: string) => api.delete(`/projects/${project.id}/tasks/${task.id}/attachments/${attachmentId}`),
    onSuccess: invalidate,
  })

  const { data: history } = useQuery<HistoryEntry[]>({
    queryKey: ['task-history', task.id],
    queryFn: async () => (await api.get(`/projects/${project.id}/tasks/${task.id}/history`)).data,
    enabled: showHistory,
  })

  const startDate = project.startDate ? addDays(project.startDate, draft.startOffsetDays) : null
  const endDate = project.startDate ? addDays(project.startDate, draft.startOffsetDays + draft.durationDays) : null

  const onDateChange = (which: 'start' | 'end', value: string) => {
    if (!project.startDate || !value) return
    const picked = new Date(value)
    const base = new Date(project.startDate)
    if (which === 'start') {
      const newOffset = Math.max(0, diffDays(base, picked))
      const currentEndOffset = draft.startOffsetDays + draft.durationDays
      setDraft((d) => ({ ...d, startOffsetDays: newOffset, durationDays: Math.max(1, currentEndOffset - newOffset) }))
    } else {
      const startOffset = draft.startOffsetDays
      const newDuration = Math.max(1, diffDays(addDays(project.startDate!, startOffset), picked))
      setDraft((d) => ({ ...d, durationDays: newDuration }))
    }
  }

  const otherTasks = allTasks.filter((t) => t.id !== task.id)
  const fileInputId = `task-file-${task.id}`

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const upload = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    addAttachment.mutate(upload.data.id)
    e.target.value = ''
  }

  return (
    <Modal open onClose={onClose} title={(task.type === 'HITO' ? 'Hito · ' : 'Tarea · ') + task.name} maxWidth={680}>
      <div className="flex flex-col gap-5">
        {/* Información general */}
        <section>
          <span className="text-[10.5px] text-subtle font-mono tracking-wide block mb-2">INFORMACIÓN GENERAL</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field label="Nombre">
              <input disabled={!canManage} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
            </Field>
            <Field label="Responsable">
              <input disabled={!canManage} value={draft.responsibleName} onChange={(e) => setDraft((d) => ({ ...d, responsibleName: e.target.value }))} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
            </Field>
            <Field label="Iniciales">
              <input disabled={!canManage} maxLength={3} value={draft.ownerInitials} onChange={(e) => setDraft((d) => ({ ...d, ownerInitials: e.target.value }))} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
            </Field>
            <Field label="Prioridad">
              <select disabled={!canManage} value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as ProjectTaskPriority }))} className="h-9 px-2.5 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70">
                {TASK_PRIORITY_ORDER.map((p) => <option key={p} value={p}>{TASK_PRIORITY_META[p].label}</option>)}
              </select>
            </Field>
            <Field label="Descripción" className="sm:col-span-2">
              <textarea disabled={!canManage} rows={2} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none disabled:opacity-70" />
            </Field>
            <label className="flex items-center gap-2 sm:col-span-2 text-[12.5px] text-body">
              <input type="checkbox" disabled={!canManage} checked={draft.isCritical} onChange={(e) => setDraft((d) => ({ ...d, isCritical: e.target.checked }))} />
              Marcar como hito crítico
            </label>
          </div>
        </section>

        {/* Planificación */}
        <section>
          <span className="text-[10.5px] text-subtle font-mono tracking-wide block mb-2">PLANIFICACIÓN Y AVANCE</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Field label="Estado">
              <select disabled={!canManage} value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ProjectTaskStatus }))} className="h-9 px-2.5 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70">
                {TASK_STATUS_ORDER.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
              </select>
            </Field>
            <Field label={`Avance (${draft.progressPct}%)`}>
              <input disabled={!canManage} type="range" min={0} max={100} value={draft.progressPct} onChange={(e) => setDraft((d) => ({ ...d, progressPct: Number(e.target.value) }))} className="h-9" />
            </Field>
            {project.startDate ? (
              <>
                <Field label="Fecha de inicio">
                  <input disabled={!canManage} type="date" value={startDate ? startDate.toISOString().slice(0, 10) : ''} onChange={(e) => onDateChange('start', e.target.value)} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
                </Field>
                <Field label="Fecha de término">
                  <input disabled={!canManage} type="date" value={endDate ? endDate.toISOString().slice(0, 10) : ''} onChange={(e) => onDateChange('end', e.target.value)} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
                </Field>
              </>
            ) : (
              <>
                <Field label="Día de inicio (relativo)">
                  <input disabled={!canManage} type="number" min={0} value={draft.startOffsetDays} onChange={(e) => setDraft((d) => ({ ...d, startOffsetDays: Number(e.target.value) }))} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
                </Field>
                <Field label="Duración (días)">
                  <input disabled={!canManage} type="number" min={1} value={draft.durationDays} onChange={(e) => setDraft((d) => ({ ...d, durationDays: Number(e.target.value) }))} className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
                </Field>
              </>
            )}
            <Field label="Observaciones" className="sm:col-span-2">
              <textarea disabled={!canManage} rows={2} value={draft.observations} onChange={(e) => setDraft((d) => ({ ...d, observations: e.target.value }))} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none disabled:opacity-70" />
            </Field>
          </div>
          {canManage && (
            <button
              onClick={() => updateMutation.mutate(draft)}
              disabled={updateMutation.isPending}
              className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              <Pencil size={13} /> {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
          {updateMutation.error != null && <p className="text-[11.5px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(updateMutation.error)}</p>}
        </section>

        {/* Dependencias */}
        <section>
          <span className="text-[10.5px] text-subtle font-mono tracking-wide flex items-center gap-1.5 mb-2"><Link2 size={11} /> DEPENDENCIAS</span>
          {otherTasks.length === 0 ? (
            <p className="text-[12px] text-muted">No hay otras tareas en este proyecto para depender de ellas.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {otherTasks.map((t) => {
                const checked = task.dependsOn.some((d) => d.dependsOnId === t.id)
                return (
                  <label key={t.id} className="flex items-center gap-2 text-[12.5px] text-body">
                    <input
                      type="checkbox"
                      disabled={!canManage}
                      checked={checked}
                      onChange={() => (checked ? removeDependency.mutate(t.id) : addDependency.mutate(t.id))}
                    />
                    Depende de: {t.name}
                  </label>
                )
              })}
            </div>
          )}
        </section>

        {/* Adjuntos */}
        <section>
          <span className="text-[10.5px] text-subtle font-mono tracking-wide flex items-center gap-1.5 mb-2"><Paperclip size={11} /> EVIDENCIAS Y ADJUNTOS</span>
          <div className="flex flex-col gap-1.5 mb-2">
            {task.attachments.length === 0 && <p className="text-[12px] text-muted">Sin adjuntos todavía.</p>}
            {task.attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 text-[12.5px] bg-sunken rounded-md px-2.5 py-1.5">
                <span className="truncate text-body">{a.upload.originalName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => downloadUpload(a.upload.id, a.upload.originalName)} className="text-subtle hover:text-ink" title="Descargar"><Download size={14} /></button>
                  {canManage && <button onClick={() => removeAttachment.mutate(a.id)} className="text-subtle hover:text-ink" title="Quitar"><X size={14} /></button>}
                </div>
              </div>
            ))}
          </div>
          {canManage && (
            <label htmlFor={fileInputId} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-card text-[12px] font-semibold text-body hover:border-[var(--accent)] cursor-pointer transition-colors">
              <Paperclip size={13} /> Adjuntar archivo
              <input id={fileInputId} type="file" className="hidden" onChange={handleUpload} />
            </label>
          )}
        </section>

        {/* Historial */}
        <section>
          <button onClick={() => setShowHistory((v) => !v)} className="text-[10.5px] text-subtle font-mono tracking-wide flex items-center gap-1.5 mb-2 hover:text-ink">
            <HistoryIcon size={11} /> HISTORIAL DE CAMBIOS {showHistory ? '▲' : '▼'}
          </button>
          {showHistory && (
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {(!history || history.length === 0) && <p className="text-[12px] text-muted">Sin historial registrado.</p>}
              {history?.map((h) => (
                <div key={h.id} className="text-[12px] text-body leading-snug">
                  <strong>{FIELD_LABELS[h.field] ?? h.field}</strong>
                  {h.fromValue && h.toValue ? <> de <span className="text-muted">{h.fromValue}</span> a <span className="text-muted">{h.toValue}</span></> : h.toValue ? <>: {h.toValue}</> : ''}
                  {h.changedByName && <span className="text-muted"> · {h.changedByName}</span>}
                  <span className="text-subtle"> · {timeAgo(h.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Eliminación */}
        {canDelete && (
          <section className="pt-3 border-t border-line">
            {!confirmingDelete ? (
              <button onClick={() => setConfirmingDelete(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line bg-card text-[12.5px] font-semibold hover:border-[var(--accent)] transition-colors" style={{ color: 'var(--accent)' }}>
                <Trash2 size={13} /> Eliminar {task.type === 'HITO' ? 'hito' : 'tarea'}
              </button>
            ) : (
              <div className="p-3 rounded-card border" style={{ background: 'var(--red-50)', borderColor: 'var(--red-50)' }}>
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle size={16} style={{ color: 'var(--red-600)' }} className="shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-body">
                    ¿Confirmas eliminar <strong>{task.name}</strong>? Esta acción no se puede deshacer desde la interfaz.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--red-600)' }}>
                    {deleteMutation.isPending ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
                  </button>
                  <button onClick={() => setConfirmingDelete(false)} className="h-9 px-3.5 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body">
                    Cancelar
                  </button>
                </div>
                {deleteMutation.error != null && <p className="text-[11.5px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(deleteMutation.error)}</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] text-subtle font-semibold">{label}</span>
      {children}
    </label>
  )
}
