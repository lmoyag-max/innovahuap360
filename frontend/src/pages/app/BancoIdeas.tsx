import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, Download, Lightbulb, Search, Inbox, ScanSearch, CheckCircle2, XCircle,
  Star, Trash2, RotateCcw, Flag, MessageSquare, CalendarDays, Building2, User, FileText,
  Sparkles, Clock, Tag,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line,
} from 'recharts'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage, downloadUpload } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

type IdeaStatus = 'RECIBIDA' | 'EN_REVISION' | 'OBSERVADA' | 'FACTIBILIDAD' | 'APROBADA' | 'RECHAZADA' | 'EN_EJECUCION' | 'CERRADA'
type IdeaPriority = 'BAJA' | 'MEDIA' | 'ALTA'

interface IdeaRow {
  id: string
  title: string
  proponentName: string
  unit: { id: string; name: string }
  projectType: string
  status: IdeaStatus
  priority: IdeaPriority
  isFeatured: boolean
  deletedAt: string | null
  createdAt: string
  _count: { comments: number }
}
interface Comment { id: string; authorName: string; comment: string; createdAt: string }
interface StatusHistoryEntry { id: string; fromStatus: IdeaStatus | null; toStatus: IdeaStatus; changedByName: string | null; note: string | null; createdAt: string }
interface IdeaDetail extends IdeaRow {
  description: string
  position: string
  email: string
  phone: string
  projectStage: string
  jefaturaApproval: boolean
  triageNote: string | null
  fichaUpload: { id: string; originalName: string; sizeBytes?: number }
  comments: Comment[]
  statusHistory: StatusHistoryEntry[]
}
interface Stats {
  total: number
  byStatus: { status: IdeaStatus; count: number }[]
  byUnit: { unit: string; count: number }[]
  byType: { projectType: string; count: number }[]
}

const STATUS_META: Record<IdeaStatus, { label: string; tone: string; bg: string }> = {
  RECIBIDA: { label: 'Recibida', tone: 'var(--blue-600)', bg: 'var(--blue-50)' },
  EN_REVISION: { label: 'En revisión', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  OBSERVADA: { label: 'Observada', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  FACTIBILIDAD: { label: 'En factibilidad', tone: 'var(--blue-600)', bg: 'var(--blue-50)' },
  APROBADA: { label: 'Aprobada', tone: 'var(--green-600)', bg: 'var(--green-50)' },
  RECHAZADA: { label: 'Rechazada', tone: 'var(--accent-700)', bg: 'var(--accent-50)' },
  EN_EJECUCION: { label: 'En ejecución', tone: 'var(--violet-600)', bg: 'var(--violet-50)' },
  CERRADA: { label: 'Cerrada', tone: 'var(--slate-500)', bg: 'var(--slate-100)' },
}
const PRIORITY_META: Record<IdeaPriority, { label: string; tone: string; bg: string }> = {
  BAJA: { label: 'Prioridad baja', tone: 'var(--slate-500)', bg: 'var(--slate-100)' },
  MEDIA: { label: 'Prioridad media', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ALTA: { label: 'Prioridad alta', tone: 'var(--accent-700)', bg: 'var(--accent-50)' },
}
const PRIORITY_ORDER: IdeaPriority[] = ['BAJA', 'MEDIA', 'ALTA']
const PROJECT_TYPE_LABEL: Record<string, string> = {
  GESTION_CLINICA: 'Gestión Clínica',
  GESTION_ADMINISTRATIVA: 'Gestión Administrativa',
  ACADEMICO_IDI: 'Académico I+D+i',
}
const PROJECT_TYPE_COLOR: Record<string, string> = {
  GESTION_CLINICA: 'var(--blue-500)',
  GESTION_ADMINISTRATIVA: 'var(--violet-500)',
  ACADEMICO_IDI: 'var(--amber-500)',
}
const PROJECT_STAGE_LABEL: Record<string, string> = {
  IDEA: 'Idea', DESARROLLO: 'Desarrollo', PILOTO_IMPLEMENTACION: 'Piloto / Implementación',
}
const STATUS_ORDER: IdeaStatus[] = ['RECIBIDA', 'EN_REVISION', 'OBSERVADA', 'FACTIBILIDAD', 'APROBADA', 'RECHAZADA', 'EN_EJECUCION', 'CERRADA']
const NEXT_ACTIONS: Record<IdeaStatus, IdeaStatus[]> = {
  RECIBIDA: ['EN_REVISION', 'RECHAZADA'],
  EN_REVISION: ['OBSERVADA', 'FACTIBILIDAD', 'RECHAZADA'],
  OBSERVADA: ['EN_REVISION', 'FACTIBILIDAD', 'RECHAZADA'],
  FACTIBILIDAD: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['CERRADA'],
  RECHAZADA: [],
  EN_EJECUCION: ['CERRADA'],
  CERRADA: [],
}
const MONTH_LABEL = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatBytes(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BancoIdeas() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('ideas.manage')
  const canAdminister = hasPermission('ideas.delete')
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<IdeaStatus | 'TODAS' | 'ELIMINADAS'>('TODAS')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')

  const { data: stats } = useQuery<Stats>({ queryKey: ['ideas-stats'], queryFn: async () => (await api.get('/ideas/stats')).data })
  const { data: ideas, isLoading } = useQuery<IdeaRow[]>({
    queryKey: ['ideas', filter, search],
    queryFn: async () =>
      (
        await api.get('/ideas', {
          params: {
            status: filter === 'TODAS' || filter === 'ELIMINADAS' ? undefined : filter,
            deleted: filter === 'ELIMINADAS' ? 'true' : undefined,
            search: search || undefined,
          },
        })
      ).data,
  })
  // Fuente sin filtrar, solo para calcular la tendencia mensual de ingreso en el
  // gráfico de línea (mismo endpoint /ideas ya existente, sin nueva lógica backend).
  const { data: trendSource } = useQuery<IdeaRow[]>({
    queryKey: ['ideas-trend-source'],
    queryFn: async () => (await api.get('/ideas')).data,
  })
  const { data: detail } = useQuery<IdeaDetail>({
    queryKey: ['idea', expandedId],
    queryFn: async () => (await api.get(`/ideas/${expandedId}`)).data,
    enabled: !!expandedId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ideas'] })
    queryClient.invalidateQueries({ queryKey: ['ideas-trend-source'] })
    queryClient.invalidateQueries({ queryKey: ['ideas-stats'] })
    queryClient.invalidateQueries({ queryKey: ['idea', expandedId] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IdeaStatus }) => api.patch(`/ideas/${id}`, { status }),
    onSuccess: invalidate,
  })
  const commentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => api.post(`/ideas/${id}/comments`, { comment }),
    onSuccess: () => { invalidate(); setCommentDraft('') },
  })
  const convertMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/convert-to-project`),
    onSuccess: invalidate,
  })
  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => api.patch(`/ideas/${id}`, { isFeatured }),
    onSuccess: invalidate,
  })
  const priorityMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: IdeaPriority }) => api.patch(`/ideas/${id}`, { priority }),
    onSuccess: invalidate,
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ideas/${id}`),
    onSuccess: invalidate,
  })
  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/restore`),
    onSuccess: invalidate,
  })

  const counts = Object.fromEntries((stats?.byStatus ?? []).map((s) => [s.status, s.count]))
  const total = stats?.total ?? 0
  const recibidas = counts.RECIBIDA ?? 0
  const enRevision = (counts.EN_REVISION ?? 0) + (counts.OBSERVADA ?? 0) + (counts.FACTIBILIDAD ?? 0)
  const aprobadas = (counts.APROBADA ?? 0) + (counts.EN_EJECUCION ?? 0)
  const rechazadas = counts.RECHAZADA ?? 0
  const pct = (n: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0)

  const doughnutData = useMemo(
    () => (stats?.byStatus ?? []).map((s) => ({ name: STATUS_META[s.status].label, value: s.count, color: STATUS_META[s.status].tone })),
    [stats],
  )
  const categoryData = useMemo(
    () => (stats?.byType ?? []).map((t) => ({ name: PROJECT_TYPE_LABEL[t.projectType] ?? t.projectType, value: t.count, color: PROJECT_TYPE_COLOR[t.projectType] ?? 'var(--accent)' })),
    [stats],
  )
  const unitData = useMemo(
    () => [...(stats?.byUnit ?? [])].sort((a, b) => a.count - b.count).map((u) => ({ name: u.unit, value: u.count })),
    [stats],
  )
  const trendData = useMemo(() => {
    if (!trendSource) return []
    const now = new Date()
    const buckets = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0)
    }
    for (const idea of trendSource) {
      const d = new Date(idea.createdAt)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
    return Array.from(buckets.entries()).map(([key, count]) => {
      const [, month] = key.split('-').map(Number)
      return { name: MONTH_LABEL[month], value: count }
    })
  }, [trendSource])

  const tooltipStyle = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 10px 28px rgba(26,31,39,.1)',
  }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
          <Lightbulb size={19} />
        </span>
        <div>
          <Eyebrow>EMBUDO DE INNOVACIÓN</Eyebrow>
          <h1 className="text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">Banco de Ideas</h1>
        </div>
      </div>
      <p className="text-[13px] text-muted mt-1.5 mb-5 max-w-[680px]">
        Ideas postuladas por la comunidad a través del portal público (<code className="font-mono">/postula</code>), con ficha técnica
        adjunta. El Comité revisa, comenta, decide y puede convertir las aprobadas en un proyecto formal del portafolio.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <IdeaKpiCard icon={<Lightbulb size={17} />} value={total} label="Total ideas" color="var(--accent)" bg="var(--accent-50)" pct={100} />
        <IdeaKpiCard icon={<Inbox size={17} />} value={recibidas} label="Recibidas" color="var(--blue-500)" bg="var(--blue-50)" pct={pct(recibidas)} />
        <IdeaKpiCard icon={<ScanSearch size={17} />} value={enRevision} label="En revisión" color="var(--amber-500)" bg="var(--amber-50)" pct={pct(enRevision)} />
        <IdeaKpiCard icon={<CheckCircle2 size={17} />} value={aprobadas} label="Aprobadas" color="var(--green-500)" bg="var(--green-50)" pct={pct(aprobadas)} />
        <IdeaKpiCard icon={<XCircle size={17} />} value={rechazadas} label="Rechazadas" color="var(--accent-700)" bg="var(--accent-50)" pct={pct(rechazadas)} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-5">
        <ChartCard title="Ideas por estado" icon={<Tag size={13} />} empty={doughnutData.length === 0}>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={170}>
              <PieChart>
                <Pie data={doughnutData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                  {doughnutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {doughnutData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11.5px] text-body">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto font-mono font-semibold text-ink">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Ideas por categoría" icon={<Sparkles size={13} />} empty={categoryData.length === 0}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-sunken)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {categoryData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ideas por servicio" icon={<Building2 size={13} />} empty={unitData.length === 0}>
          <ResponsiveContainer width="100%" height={Math.max(170, unitData.length * 28)}>
            <BarChart data={unitData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-sunken)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="var(--accent)" barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tendencia de ingreso (6 meses)" icon={<Clock size={13} />} empty={trendData.length === 0}>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={trendData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--accent)', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="h-9 w-[220px] pl-8 pr-3 rounded-full border border-line bg-card text-[12.5px] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        {(['TODAS', ...STATUS_ORDER] as const).map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={s === 'TODAS' ? 'Todas' : STATUS_META[s].label}
            count={s !== 'TODAS' ? counts[s] : undefined}
            tone={s === 'TODAS' ? undefined : STATUS_META[s].tone}
          />
        ))}
        {canAdminister && (
          <FilterChip
            active={filter === 'ELIMINADAS'}
            onClick={() => setFilter('ELIMINADAS')}
            label="Eliminadas"
            icon={<Trash2 size={11.5} />}
            tone="var(--slate-500)"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start">
        {/* Listado */}
        <div className="flex flex-col gap-2.5">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          {!isLoading && ideas?.length === 0 && (
            <div className="bg-card border border-line rounded-card p-8 text-center">
              <Inbox size={26} className="mx-auto mb-2 text-subtle" />
              <p className="text-[12.5px] text-muted">No hay ideas en este filtro.</p>
            </div>
          )}
          {ideas?.map((idea) => {
            const on = idea.id === expandedId
            return (
              <button
                key={idea.id}
                onClick={() => setExpandedId(idea.id)}
                className="text-left bg-card border rounded-card p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
                style={on ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--focus-ring)' } : { borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[idea.status].tone, background: STATUS_META[idea.status].bg }}>
                    {STATUS_META[idea.status].label}
                  </span>
                  {idea.isFeatured && (
                    <span title="Destacada" className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ color: 'var(--amber-600)', background: 'var(--amber-50)' }}>
                      <Star size={11} fill="currentColor" />
                    </span>
                  )}
                  {idea.priority !== 'MEDIA' && (
                    <span
                      title={PRIORITY_META[idea.priority].label}
                      className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: PRIORITY_META[idea.priority].tone, background: PRIORITY_META[idea.priority].bg }}
                    >
                      <Flag size={9} fill="currentColor" />
                    </span>
                  )}
                  {idea.deletedAt && (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--slate-500)' }}>ELIMINADA</span>
                  )}
                  <span className="text-[11px] text-muted ml-auto">{PROJECT_TYPE_LABEL[idea.projectType]}</span>
                </div>
                <div className="text-[13.5px] font-semibold text-ink leading-snug">{idea.title}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted mt-1 flex-wrap">
                  <User size={11} className="text-subtle" /> {idea.proponentName}
                  <span className="text-subtle">·</span>
                  <Building2 size={11} className="text-subtle" /> {idea.unit.name}
                  <span className="text-subtle">·</span>
                  <CalendarDays size={11} className="text-subtle" /> {new Date(idea.createdAt).toLocaleDateString('es-CL')}
                  {idea._count.comments > 0 && (
                    <>
                      <span className="text-subtle">·</span>
                      <MessageSquare size={11} className="text-subtle" /> {idea._count.comments}
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalle */}
        {detail ? (
          <div className="bg-card border border-line rounded-card p-5">
            {detail.deletedAt && (
              <div className="flex items-center gap-2 mb-3.5 px-3 py-2 rounded-[8px] text-[12px] font-semibold" style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                <Trash2 size={13} /> Esta idea fue eliminada.
                {canAdminister && (
                  <button
                    onClick={() => restoreMutation.mutate(detail.id)}
                    disabled={restoreMutation.isPending}
                    className="ml-auto inline-flex items-center gap-1 font-bold disabled:opacity-60"
                    style={{ color: 'var(--accent)' }}
                  >
                    <RotateCcw size={12} /> Restaurar
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[detail.status].tone, background: STATUS_META[detail.status].bg }}>
                  {STATUS_META[detail.status].label}
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: PRIORITY_META[detail.priority].tone, background: PRIORITY_META[detail.priority].bg }}>
                  <Flag size={10} fill="currentColor" /> {PRIORITY_META[detail.priority].label}
                </span>
              </div>
              <button onClick={() => downloadUpload(detail.fichaUpload.id, detail.fichaUpload.originalName)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                <Download size={13} /> Ficha técnica {formatBytes(detail.fichaUpload.sizeBytes) ? `(${formatBytes(detail.fichaUpload.sizeBytes)})` : ''}
              </button>
            </div>
            <h2 className="text-[18px] font-bold text-ink mt-1.5 mb-2.5 flex items-center gap-2">
              {detail.title}
              {detail.isFeatured && <Star size={15} fill="var(--amber-500)" style={{ color: 'var(--amber-500)' }} />}
            </h2>
            <p className="text-[13px] text-body leading-relaxed mb-3.5">{detail.description}</p>

            <div className="grid grid-cols-2 gap-2.5 text-[11.5px] text-muted mb-4 p-3 rounded-[10px] bg-inset">
              <div><strong className="text-ink">Solicitante:</strong> {detail.proponentName}</div>
              <div><strong className="text-ink">Cargo:</strong> {detail.position}</div>
              <div><strong className="text-ink">Correo:</strong> {detail.email}</div>
              <div><strong className="text-ink">Contacto:</strong> {detail.phone}</div>
              <div><strong className="text-ink">Unidad:</strong> {detail.unit.name}</div>
              <div><strong className="text-ink">Tipo:</strong> {PROJECT_TYPE_LABEL[detail.projectType]}</div>
              <div><strong className="text-ink">Etapa declarada:</strong> {PROJECT_STAGE_LABEL[detail.projectStage]}</div>
              <div><strong className="text-ink">Aprobación jefatura:</strong> {detail.jefaturaApproval ? 'Sí' : 'No'}</div>
            </div>

            {canManage && !detail.deletedAt && NEXT_ACTIONS[detail.status].length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {NEXT_ACTIONS[detail.status].map((next) => (
                  <button
                    key={next}
                    onClick={() => statusMutation.mutate({ id: detail.id, status: next })}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-md border transition-transform hover:-translate-y-0.5"
                    style={{ color: STATUS_META[next].tone, background: STATUS_META[next].bg, borderColor: 'transparent' }}
                  >
                    Mover a {STATUS_META[next].label}
                  </button>
                ))}
                {detail.status === 'APROBADA' && (
                  <button
                    onClick={() => convertMutation.mutate(detail.id)}
                    disabled={convertMutation.isPending}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-md text-white inline-flex items-center gap-1.5 disabled:opacity-60 transition-transform hover:-translate-y-0.5"
                    style={{ background: 'var(--accent)' }}
                  >
                    Convertir en proyecto <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}

            {canAdminister && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-[10px]" style={{ background: 'var(--surface-sunken)' }}>
                <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide mr-1">Administrador</span>
                <button
                  title={detail.isFeatured ? 'Quitar destacado' : 'Marcar como destacada'}
                  onClick={() => featureMutation.mutate({ id: detail.id, isFeatured: !detail.isFeatured })}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-line bg-card hover:border-[var(--accent)]"
                  style={detail.isFeatured ? { color: 'var(--amber-600)' } : { color: 'var(--text-body)' }}
                >
                  <Star size={13} fill={detail.isFeatured ? 'currentColor' : 'none'} />
                </button>
                <div className="flex items-center gap-1">
                  {PRIORITY_ORDER.map((p) => (
                    <button
                      key={p}
                      title={PRIORITY_META[p].label}
                      onClick={() => priorityMutation.mutate({ id: detail.id, priority: p })}
                      className="text-[10.5px] font-bold px-2 py-1 rounded-md border"
                      style={
                        detail.priority === p
                          ? { color: '#fff', background: PRIORITY_META[p].tone, borderColor: PRIORITY_META[p].tone }
                          : { color: PRIORITY_META[p].tone, background: 'var(--surface-card)', borderColor: 'var(--border)' }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {!detail.deletedAt && (
                  <button
                    title="Eliminar idea"
                    onClick={() => { if (confirm('¿Eliminar esta idea? Podrás restaurarla luego desde el filtro "Eliminadas".')) deleteMutation.mutate(detail.id) }}
                    className="w-7 h-7 flex items-center justify-center rounded-md border border-line bg-card hover:border-[var(--accent)] text-body ml-auto"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
            {(statusMutation.error || convertMutation.error || deleteMutation.error || restoreMutation.error) && (
              <p className="text-[11px] mb-3" style={{ color: 'var(--accent)' }}>
                {apiErrorMessage(statusMutation.error ?? convertMutation.error ?? deleteMutation.error ?? restoreMutation.error)}
              </p>
            )}

            <h4 className="text-[12.5px] font-bold text-ink mb-2.5">Línea de tiempo</h4>
            <div className="flex flex-col mb-4 max-h-[140px] overflow-y-auto">
              {detail.statusHistory.map((h, i) => (
                <div key={h.id} className="flex gap-2.5 relative pb-3 last:pb-0">
                  {i < detail.statusHistory.length - 1 && (
                    <span className="absolute left-[5px] top-3 bottom-0 w-px" style={{ background: 'var(--border)' }} />
                  )}
                  <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: STATUS_META[h.toStatus].tone }} />
                  <div className="text-[11.5px] text-muted leading-snug">
                    <span className="font-mono text-[10px]">{new Date(h.createdAt).toLocaleString('es-CL')}</span>
                    {' — '}
                    {h.fromStatus ? `${STATUS_META[h.fromStatus].label} → ` : ''}
                    <strong className="text-ink">{STATUS_META[h.toStatus].label}</strong> ({h.changedByName})
                    {h.note && <div className="italic text-subtle mt-0.5">"{h.note}"</div>}
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-[12.5px] font-bold text-ink mb-2 flex items-center gap-1.5">
              <MessageSquare size={13} /> Comentarios del Comité
            </h4>
            <div className="flex flex-col gap-2 mb-3 max-h-[160px] overflow-y-auto">
              {detail.comments.length === 0 && <p className="text-[12px] text-muted">Sin comentarios todavía.</p>}
              {detail.comments.map((c) => (
                <div key={c.id} className="text-[12.5px] bg-inset rounded-[8px] p-2.5">
                  <div className="text-[11px] text-muted mb-0.5">{c.authorName} · {new Date(c.createdAt).toLocaleString('es-CL')}</div>
                  {c.comment}
                </div>
              ))}
            </div>
            {canManage && !detail.deletedAt && (
              <div className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Agregar comentario u observación…"
                  className="flex-1 h-9 px-3 rounded-md border border-line bg-inset text-[12.5px]"
                />
                <button
                  onClick={() => commentDraft.trim() && commentMutation.mutate({ id: detail.id, comment: commentDraft.trim() })}
                  disabled={commentMutation.isPending}
                  className="h-9 px-3.5 rounded-md text-white font-semibold text-[12px] disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-line rounded-card p-8 text-center">
            <FileText size={26} className="mx-auto mb-2 text-subtle" />
            <p className="text-[13px] text-muted">Selecciona una idea para ver el detalle.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function IdeaKpiCard({ icon, value, label, color, bg, pct }: { icon: ReactNode; value: number | string; label: string; color: string; bg: string; pct: number }) {
  return (
    <div
      className="group relative overflow-hidden rounded-card border border-line p-3.5 sm:p-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ background: `linear-gradient(160deg, ${bg}, var(--surface-card) 70%)` }}
    >
      <span className="absolute -right-3 -top-3 w-[58px] h-[58px] rounded-full opacity-[0.12]" style={{ background: color }} />
      <span
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110"
        style={{ background: color, color: '#fff' }}
      >
        {icon}
      </span>
      <div className="font-mono text-[22px] sm:text-[26px] font-bold text-ink leading-none tracking-tight">{value}</div>
      <div className="text-[11.5px] text-muted mt-1.5 font-semibold leading-tight">{label}</div>
      <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ChartCard({ title, icon, children, empty }: { title: string; icon: ReactNode; children: ReactNode; empty?: boolean }) {
  return (
    <div className="bg-card border border-line rounded-card p-4 sm:p-[18px]">
      <h3 className="text-[12.5px] font-bold text-ink mb-3 flex items-center gap-1.5">
        <span style={{ color: 'var(--accent)' }}>{icon}</span> {title}
      </h3>
      {empty ? <p className="text-[12px] text-muted py-10 text-center">Sin datos suficientes todavía.</p> : children}
    </div>
  )
}

function FilterChip({ active, onClick, label, count, tone, icon }: { active: boolean; onClick: () => void; label: string; count?: number; tone?: string; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="text-[12.5px] px-3 py-1.5 rounded-full border transition-all duration-150 inline-flex items-center gap-1.5 hover:-translate-y-0.5"
      style={
        active
          ? { color: '#fff', background: tone ?? 'var(--accent)', borderColor: tone ?? 'var(--accent)' }
          : { color: 'var(--text-body)', background: 'var(--surface-sunken)', borderColor: 'var(--border)' }
      }
    >
      {icon}
      {label}
      {typeof count === 'number' && count > 0 && (
        <span
          className="font-mono text-[10px] font-bold px-1.5 rounded-full"
          style={active ? { background: 'rgba(255,255,255,.25)' } : { background: 'var(--surface-card)' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-line rounded-card p-3.5 animate-pulse">
      <div className="h-4 w-24 rounded-full mb-2.5" style={{ background: 'var(--surface-sunken)' }} />
      <div className="h-3.5 w-3/4 rounded mb-2" style={{ background: 'var(--surface-sunken)' }} />
      <div className="h-3 w-1/2 rounded" style={{ background: 'var(--surface-sunken)' }} />
    </div>
  )
}
