import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Download, Lightbulb, Search } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage, downloadUpload } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

type IdeaStatus = 'RECIBIDA' | 'EN_REVISION' | 'OBSERVADA' | 'FACTIBILIDAD' | 'APROBADA' | 'RECHAZADA' | 'EN_EJECUCION' | 'CERRADA'

interface IdeaRow {
  id: string
  title: string
  proponentName: string
  unit: { id: string; name: string }
  projectType: string
  status: IdeaStatus
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
  fichaUpload: { id: string; originalName: string }
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
const PROJECT_TYPE_LABEL: Record<string, string> = {
  GESTION_CLINICA: 'Gestión Clínica',
  GESTION_ADMINISTRATIVA: 'Gestión Administrativa',
  ACADEMICO_IDI: 'Académico I+D+i',
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

export default function BancoIdeas() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('ideas.manage')
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<IdeaStatus | 'TODAS'>('TODAS')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')

  const { data: stats } = useQuery<Stats>({ queryKey: ['ideas-stats'], queryFn: async () => (await api.get('/ideas/stats')).data })
  const { data: ideas, isLoading } = useQuery<IdeaRow[]>({
    queryKey: ['ideas', filter, search],
    queryFn: async () =>
      (await api.get('/ideas', { params: { status: filter === 'TODAS' ? undefined : filter, search: search || undefined } })).data,
  })
  const { data: detail } = useQuery<IdeaDetail>({
    queryKey: ['idea', expandedId],
    queryFn: async () => (await api.get(`/ideas/${expandedId}`)).data,
    enabled: !!expandedId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ideas'] })
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

  const counts = Object.fromEntries((stats?.byStatus ?? []).map((s) => [s.status, s.count]))

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

      {/* Dashboard de ideas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <StatCard value={stats?.total ?? '—'} label="Total ideas" />
        <StatCard value={counts.RECIBIDA ?? 0} label="Recibidas" />
        <StatCard value={(counts.EN_REVISION ?? 0) + (counts.OBSERVADA ?? 0) + (counts.FACTIBILIDAD ?? 0)} label="En revisión" />
        <StatCard value={(counts.APROBADA ?? 0) + (counts.EN_EJECUCION ?? 0)} label="Aprobadas" />
        <StatCard value={counts.RECHAZADA ?? 0} label="Rechazadas" />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título…"
            className="h-9 w-[220px] pl-8 pr-3 rounded-full border border-line bg-card text-[12.5px] outline-none focus:border-[var(--accent)]"
          />
        </div>
        {(['TODAS', ...STATUS_ORDER] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="text-[12.5px] px-3 py-1.5 rounded-full border transition-colors"
            style={
              filter === s
                ? { color: 'var(--accent)', background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }
                : { color: 'var(--text-body)', background: 'var(--surface-sunken)', borderColor: 'var(--border)' }
            }
          >
            {s === 'TODAS' ? 'Todas' : STATUS_META[s].label}{s !== 'TODAS' && counts[s] ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 items-start">
        {/* Listado */}
        <div className="flex flex-col gap-2.5">
          {isLoading && <p className="text-[12.5px] text-muted">Cargando…</p>}
          {ideas?.length === 0 && <p className="text-[12.5px] text-muted">No hay ideas en este filtro.</p>}
          {ideas?.map((idea) => {
            const on = idea.id === expandedId
            return (
              <button
                key={idea.id}
                onClick={() => setExpandedId(idea.id)}
                className="text-left bg-card border rounded-card p-3.5 transition-colors"
                style={on ? { borderColor: 'var(--accent)' } : { borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[idea.status].tone, background: STATUS_META[idea.status].bg }}>
                    {STATUS_META[idea.status].label}
                  </span>
                  <span className="text-[11px] text-muted">{PROJECT_TYPE_LABEL[idea.projectType]}</span>
                </div>
                <div className="text-[13.5px] font-semibold text-ink leading-snug">{idea.title}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  {idea.proponentName} · {idea.unit.name} · {new Date(idea.createdAt).toLocaleDateString('es-CL')}
                  {idea._count.comments > 0 ? ` · ${idea._count.comments} comentario(s)` : ''}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalle */}
        {detail ? (
          <div className="bg-card border border-line rounded-card p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[detail.status].tone, background: STATUS_META[detail.status].bg }}>
                {STATUS_META[detail.status].label}
              </span>
              <button onClick={() => downloadUpload(detail.fichaUpload.id, detail.fichaUpload.originalName)} className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                <Download size={13} /> Ficha técnica
              </button>
            </div>
            <h2 className="text-[18px] font-bold text-ink mt-1.5 mb-2.5">{detail.title}</h2>
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

            {canManage && NEXT_ACTIONS[detail.status].length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {NEXT_ACTIONS[detail.status].map((next) => (
                  <button
                    key={next}
                    onClick={() => statusMutation.mutate({ id: detail.id, status: next })}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-md border"
                    style={{ color: STATUS_META[next].tone, background: STATUS_META[next].bg, borderColor: 'transparent' }}
                  >
                    Mover a {STATUS_META[next].label}
                  </button>
                ))}
                {detail.status === 'APROBADA' && (
                  <button
                    onClick={() => convertMutation.mutate(detail.id)}
                    disabled={convertMutation.isPending}
                    className="text-[12px] font-bold px-3 py-1.5 rounded-md text-white inline-flex items-center gap-1.5 disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}
                  >
                    Convertir en proyecto <ArrowRight size={13} />
                  </button>
                )}
              </div>
            )}
            {(statusMutation.error || convertMutation.error) && (
              <p className="text-[11px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(statusMutation.error ?? convertMutation.error)}</p>
            )}

            <h4 className="text-[12.5px] font-bold text-ink mb-2">Historial de estados</h4>
            <div className="flex flex-col gap-1.5 mb-4 max-h-[120px] overflow-y-auto">
              {detail.statusHistory.map((h) => (
                <div key={h.id} className="text-[11.5px] text-muted">
                  <span className="font-mono text-[10px]">{new Date(h.createdAt).toLocaleString('es-CL')}</span> — {h.fromStatus ? `${STATUS_META[h.fromStatus].label} → ` : ''}<strong className="text-ink">{STATUS_META[h.toStatus].label}</strong> ({h.changedByName})
                </div>
              ))}
            </div>

            <h4 className="text-[12.5px] font-bold text-ink mb-2">Comentarios del Comité</h4>
            <div className="flex flex-col gap-2 mb-3 max-h-[160px] overflow-y-auto">
              {detail.comments.length === 0 && <p className="text-[12px] text-muted">Sin comentarios todavía.</p>}
              {detail.comments.map((c) => (
                <div key={c.id} className="text-[12.5px] bg-inset rounded-[8px] p-2.5">
                  <div className="text-[11px] text-muted mb-0.5">{c.authorName} · {new Date(c.createdAt).toLocaleString('es-CL')}</div>
                  {c.comment}
                </div>
              ))}
            </div>
            {canManage && (
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
          <div className="bg-card border border-line rounded-card p-8 text-center text-[13px] text-muted">
            Selecciona una idea para ver el detalle.
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-card border border-line rounded-card p-3.5">
      <div className="font-mono text-[22px] font-bold text-ink leading-none">{value}</div>
      <div className="text-[11.5px] text-muted mt-1 font-semibold">{label}</div>
    </div>
  )
}
