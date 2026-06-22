import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  Plus, X, Search, Kanban as KanbanIcon, LayoutGrid, Table2, GripVertical,
  ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, ImageOff, Lightbulb,
} from 'lucide-react'
import { Eyebrow, Dot, Badge, ProgressBar } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { STAGES, STAGE_ORDER, RISK_META, type ProjectStage, type RiskLevel } from '../../lib/stages'

interface ProjectRow {
  id: string
  name: string
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
  updatedAt: string
  ideas?: { id: string; title: string; proponentName: string }[]
}

function OriginBadge() {
  return (
    <span
      title="Este proyecto nació de una idea en el Banco de Ideas"
      className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}
    >
      <Lightbulb size={10} /> Banco de Ideas
    </span>
  )
}

type ViewMode = 'kanban' | 'tarjetas' | 'tabla'
type SortKey = 'name' | 'stage' | 'ownerName' | 'progressPct' | 'startDate' | 'dueDate' | 'riskLevel' | 'updatedAt'

const VIEW_STORAGE_KEY = 'proyectos.viewMode'
const RISK_OPTIONS: RiskLevel[] = ['BAJO', 'MEDIO', 'ALTO']

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
function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('es-CL') : '—'
}

export default function Proyectos() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode) || 'kanban')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ProjectStage | 'TODAS'>('TODAS')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'TODOS'>('TODOS')
  const [collapsed, setCollapsed] = useState<Partial<Record<ProjectStage, boolean>>>({})
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'updatedAt', dir: 'desc' })

  useEffect(() => { localStorage.setItem(VIEW_STORAGE_KEY, view) }, [view])

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (projects ?? []).filter((p) => {
      if (stageFilter !== 'TODAS' && p.stage !== stageFilter) return false
      if (riskFilter !== 'TODOS' && p.riskLevel !== riskFilter) return false
      if (term && !`${p.name} ${p.ownerName} ${p.sponsor ?? ''}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [projects, search, stageFilter, riskFilter])

  return (
    <div className="animate-viewin h-full flex flex-col">
      <div className="shrink-0 p-4 sm:px-6 sm:pt-[22px] sm:pb-3.5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <Eyebrow>PROYECTOS</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Pipeline de innovación
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="text-[12.5px] text-muted bg-card border border-line px-3 py-2 rounded-md">
            {filtered.length} proyecto{filtered.length === 1 ? '' : 's'}
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

      {/* Barra de filtros + selector de vista */}
      <div className="shrink-0 px-4 sm:px-6 mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-[340px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, responsable o sponsor…"
            className="w-full h-9 pl-8 pr-3 rounded-md border border-line bg-inset text-[12.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as ProjectStage | 'TODAS')}
          className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] text-body"
        >
          <option value="TODAS">Todas las etapas</option>
          {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGES[s].label}</option>)}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'TODOS')}
          className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] text-body"
        >
          <option value="TODOS">Todos los riesgos</option>
          {RISK_OPTIONS.map((r) => <option key={r} value={r}>Riesgo {r.toLowerCase()}</option>)}
        </select>
        <div className="ml-auto inline-flex rounded-md border border-line bg-card p-0.5 gap-0.5">
          <ViewButton active={view === 'kanban'} onClick={() => setView('kanban')} icon={<KanbanIcon size={14} />} label="Kanban" />
          <ViewButton active={view === 'tarjetas'} onClick={() => setView('tarjetas')} icon={<LayoutGrid size={14} />} label="Tarjetas" />
          <ViewButton active={view === 'tabla'} onClick={() => setView('tabla')} icon={<Table2 size={14} />} label="Tabla" />
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

      {view === 'kanban' && (
        <KanbanBoard
          projects={filtered}
          canManage={canManage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onMove={(id, stage) => stageMutation.mutate({ id, stage })}
        />
      )}
      {view === 'tarjetas' && <CardsGrid projects={filtered} />}
      {view === 'tabla' && <ExecutiveTable projects={filtered} sort={sort} setSort={setSort} />}
    </div>
  )
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[6px] text-[12px] font-semibold transition-colors"
      style={active ? { background: 'var(--accent-50)', color: 'var(--accent)' } : { color: 'var(--text-muted)' }}
    >
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function StageBadge({ stage }: { stage: ProjectStage }) {
  return <Badge color={STAGES[stage].color} bg="var(--surface-sunken)">{STAGES[stage].label}</Badge>
}
function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const m = RISK_META[riskLevel]
  return <Badge color={m.color} bg={m.bg}>Riesgo {riskLevel.toLowerCase()}</Badge>
}

/* ================= KANBAN ================= */

function KanbanBoard({
  projects, canManage, collapsed, setCollapsed, onMove,
}: {
  projects: ProjectRow[]
  canManage: boolean
  collapsed: Partial<Record<ProjectStage, boolean>>
  setCollapsed: React.Dispatch<React.SetStateAction<Partial<Record<ProjectStage, boolean>>>>
  onMove: (id: string, stage: ProjectStage) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeProject = projects.find((p) => p.id === activeId) ?? null

  const columns = STAGE_ORDER.map((stage) => ({ stage, cards: projects.filter((p) => p.stage === stage) }))

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const targetStage = over.id as ProjectStage
    const project = projects.find((p) => p.id === active.id)
    if (project && project.stage !== targetStage) onMove(project.id, targetStage)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 sm:px-6 pb-6 min-h-0">
        <div className="flex gap-3 h-full items-start min-w-full">
          {columns.map((col) => (
            <KanbanColumn
              key={col.stage}
              stage={col.stage}
              cards={col.cards}
              canManage={canManage}
              collapsed={!!collapsed[col.stage]}
              onToggleCollapse={() => setCollapsed((c) => ({ ...c, [col.stage]: !c[col.stage] }))}
              onMove={onMove}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeProject && <KanbanCardPreview project={activeProject} />}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  stage, cards, canManage, collapsed, onToggleCollapse, onMove,
}: {
  stage: ProjectStage
  cards: ProjectRow[]
  canManage: boolean
  collapsed: boolean
  onToggleCollapse: () => void
  onMove: (id: string, stage: ProjectStage) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="shrink-0 w-[40px] h-full flex flex-col items-center gap-2 py-3 rounded-xl border border-line bg-card hover:bg-hover transition-colors"
        title={`Expandir ${STAGES[stage].label}`}
      >
        <ChevronRight size={14} className="text-subtle" />
        <Dot color={STAGES[stage].color} />
        <span className="font-mono text-[11px] text-muted bg-sunken px-1.5 rounded-full">{cards.length}</span>
        <span
          className="font-bold text-[12px] text-ink whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {STAGES[stage].label}
        </span>
      </button>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[230px] max-w-[300px] shrink-0 flex flex-col max-h-full rounded-xl transition-colors"
      style={isOver ? { background: 'var(--accent-50)' } : undefined}
    >
      <div className="flex items-center gap-2 px-1 pb-3">
        <Dot color={STAGES[stage].color} />
        <span className="font-bold text-[13px] text-ink">{STAGES[stage].label}</span>
        <span className="font-mono text-[11px] text-muted bg-sunken px-[7px] rounded-full">{cards.length}</span>
        <button onClick={onToggleCollapse} className="ml-auto text-subtle hover:text-ink" title="Colapsar columna">
          <ChevronLeft size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto p-0.5">
        {cards.map((c) => (
          <KanbanCard key={c.id} project={c} canManage={canManage} onMove={onMove} />
        ))}
      </div>
    </div>
  )
}

function KanbanCard({ project: c, canManage, onMove }: { project: ProjectRow; canManage: boolean; onMove: (id: string, stage: ProjectStage) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: c.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-line rounded-xl p-3.5 shadow-card transition-all hover:shadow-card-hover"
      data-dragging={isDragging || undefined}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {canManage && (
          <button {...attributes} {...listeners} className="text-subtle hover:text-ink cursor-grab active:cursor-grabbing -ml-1 p-0.5" title="Arrastrar para mover de etapa">
            <GripVertical size={14} />
          </button>
        )}
        <Dot color={RISK_META[c.riskLevel].color} size={7} />
        <span className="font-mono text-[10px] text-muted">Riesgo {c.riskLevel.toLowerCase()}</span>
        {!!c.ideas?.length && <span className="ml-auto"><OriginBadge /></span>}
      </div>
      <Link to={`/app/proyectos/${c.id}`} className="text-[13.5px] font-semibold text-ink leading-snug mb-2.5 block hover:text-[var(--accent)] transition-colors">
        {c.name}
      </Link>
      {typeof c.progressPct === 'number' && (
        <div className="mb-2.5">
          <ProgressBar pct={c.progressPct} color={STAGES[c.stage].color} height={6} />
        </div>
      )}
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
            onChange={(e) => onMove(c.id, e.target.value as ProjectStage)}
            className="font-mono text-[10px] text-subtle bg-transparent border-none outline-none shrink-0"
            title="Mover de etapa (alternativa a arrastrar)"
          >
            {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGES[s].label}</option>)}
          </select>
        ) : (
          <span className="font-mono text-[10.5px] text-subtle">{fmtDate(c.dueDate)}</span>
        )}
      </div>
    </div>
  )
}

function KanbanCardPreview({ project: c }: { project: ProjectRow }) {
  return (
    <div className="bg-card border border-line rounded-xl p-3.5 shadow-card-hover w-[260px] rotate-1">
      <div className="text-[13.5px] font-semibold text-ink leading-snug">{c.name}</div>
      <div className="text-[11.5px] text-muted mt-1">{c.ownerName}</div>
    </div>
  )
}

/* ================= TARJETAS ================= */

function CardsGrid({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        <p className="text-[13px] text-muted bg-card border border-line rounded-card px-4 py-6 text-center">
          No hay proyectos que coincidan con los filtros actuales.
        </p>
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((p) => <ProjectGridCard key={p.id} project={p} />)}
      </div>
    </div>
  )
}

function ProjectGridCard({ project: p }: { project: ProjectRow }) {
  return (
    <Link
      to={`/app/proyectos/${p.id}`}
      className="group bg-card border border-line rounded-card overflow-hidden shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover flex flex-col"
    >
      {p.imageUrl ? (
        <img src={p.imageUrl} alt={p.name} className="h-[120px] w-full object-cover" />
      ) : (
        <div
          className="h-[80px] w-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${STAGES[p.stage].color}, var(--surface-sunken))` }}
        >
          <ImageOff size={20} className="text-white/70" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <StageBadge stage={p.stage} />
          <RiskBadge riskLevel={p.riskLevel} />
          {!!p.ideas?.length && <OriginBadge />}
        </div>
        <h4 className="text-[15px] text-ink tracking-tight leading-snug mb-2 font-semibold group-hover:text-[var(--accent)] transition-colors">
          {p.name}
        </h4>
        {typeof p.progressPct === 'number' && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] text-subtle font-mono">AVANCE</span>
              <span className="text-[10.5px] text-muted font-mono font-semibold">{p.progressPct}%</span>
            </div>
            <ProgressBar pct={p.progressPct} color={STAGES[p.stage].color} height={6} />
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-3 mt-auto">
          <span className="w-[20px] h-[20px] rounded-full bg-sunken text-muted flex items-center justify-center text-[8.5px] font-bold font-mono">
            {initials(p.ownerName)}
          </span>
          <span className="text-[11.5px] text-muted truncate">{p.ownerName}{p.sponsor ? ` · ${p.sponsor}` : ''}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-line text-xs">
          <span className="font-mono font-semibold truncate" style={{ color: 'var(--accent)' }}>{p.kpiSummary ?? '—'}</span>
          <span className="text-subtle font-mono">{fmtDate(p.dueDate)}</span>
        </div>
      </div>
    </Link>
  )
}

/* ================= TABLA EJECUTIVA ================= */

function ExecutiveTable({
  projects, sort, setSort,
}: {
  projects: ProjectRow[]
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  setSort: React.Dispatch<React.SetStateAction<{ key: SortKey; dir: 'asc' | 'desc' }>>
}) {
  const sorted = useMemo(() => {
    const list = [...projects]
    list.sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [projects, sort])

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Proyecto' },
    { key: 'stage', label: 'Estado' },
    { key: 'ownerName', label: 'Responsable' },
    { key: 'progressPct', label: 'Avance' },
    { key: 'startDate', label: 'Fecha inicio' },
    { key: 'dueDate', label: 'Fecha fin' },
    { key: 'riskLevel', label: 'Riesgo' },
    { key: 'updatedAt', label: 'Última actualización' },
  ]

  return (
    <div className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
      <div className="bg-card border border-line rounded-card overflow-hidden min-w-[820px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-inset border-b border-line">
              {columns.map((col) => (
                <th key={col.key} className="px-3.5 py-2.5">
                  <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.08em] text-subtle hover:text-ink uppercase">
                    {col.label}
                    {sort.key === col.key ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ChevronsUpDown size={11} className="opacity-40" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-[12.5px] text-muted">Sin resultados para los filtros actuales.</td></tr>
            )}
            {sorted.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-hover transition-colors">
                <td className="px-3.5 py-2.5">
                  <Link to={`/app/proyectos/${p.id}`} className="text-[13px] font-semibold text-ink hover:text-[var(--accent)] transition-colors">
                    {p.name}
                  </Link>
                </td>
                <td className="px-3.5 py-2.5"><StageBadge stage={p.stage} /></td>
                <td className="px-3.5 py-2.5 text-[12.5px] text-body">{p.ownerName}</td>
                <td className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2 w-[110px]">
                    <ProgressBar pct={p.progressPct ?? 0} color={STAGES[p.stage].color} height={6} />
                    <span className="font-mono text-[11px] text-muted shrink-0">{p.progressPct ?? 0}%</span>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted">{fmtDate(p.startDate)}</td>
                <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted">{fmtDate(p.dueDate)}</td>
                <td className="px-3.5 py-2.5"><RiskBadge riskLevel={p.riskLevel} /></td>
                <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted">{fmtDate(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
