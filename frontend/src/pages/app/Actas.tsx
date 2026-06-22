import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, CalendarDays, ClipboardList, Clock, Download, FileText, Pencil, Plus,
  Search, Trash2, User, Users, AlertTriangle, Eye, Loader2, ExternalLink, FileWarning,
} from 'lucide-react'
import { Eyebrow, Kpi, Modal, EmptyState, Badge } from '../../components/ui'
import { api, apiErrorMessage, downloadUpload, previewUpload } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

type MinuteStatusValue = 'BORRADOR' | 'PUBLICADA' | 'ARCHIVADA'
type AgreementState = 'PENDIENTE' | 'EN_CURSO' | 'CUMPLIDO' | 'VENCIDO'

interface UploadRef { id: string; originalName: string; sizeBytes: number }
interface MinuteRow {
  id: string
  title: string
  sessionDate: string
  isExtraordinary: boolean
  attendeesCount: number
  secretary: string | null
  tags: string[]
  status: MinuteStatusValue
  documentUpload: UploadRef | null
  _count: { agreements: number }
}
interface Agreement {
  id: string
  description: string
  responsible: string
  dueDate: string | null
  state: AgreementState
}
interface MinuteDetail extends MinuteRow {
  attendeeInitials: string[]
  participants: string[]
  summary: string | null
  keyAgreementsNote: string | null
  commitments: string | null
  observations: string | null
  agreements: Agreement[]
}
interface MinuteStats {
  total: number
  actasThisYear: number
  lastMinute: { id: string; title: string; sessionDate: string } | null
  totalAgreements: number
  pendingCommitments: number
}

const STATE_COLOR: Record<AgreementState, string> = {
  PENDIENTE: 'var(--accent)',
  EN_CURSO: 'var(--amber-500)',
  CUMPLIDO: 'var(--green-500)',
  VENCIDO: 'var(--accent)',
}
const STATUS_META: Record<MinuteStatusValue, { label: string; tone: string; bg: string }> = {
  BORRADOR: { label: 'Borrador', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  PUBLICADA: { label: 'Publicada', tone: 'var(--green-600)', bg: 'var(--green-50)' },
  ARCHIVADA: { label: 'Archivada', tone: 'var(--slate-500)', bg: 'var(--slate-100)' },
}
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatBytes(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function splitList(value: string): string[] {
  return Array.from(new Set(value.split(',').map((v) => v.trim()).filter(Boolean)))
}

export default function Actas() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('minutes.manage')
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [type, setType] = useState('')
  const [secretary, setSecretary] = useState('')
  const [status, setStatus] = useState('')
  const [tag, setTag] = useState('')

  const [viewId, setViewId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MinuteRow | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const filters = { search, year, month, type, secretary, status, tag }
  const hasActiveFilters = Object.values(filters).some((v) => v)

  const { data: minutes, isLoading } = useQuery<MinuteRow[]>({
    queryKey: ['minutes', filters],
    queryFn: async () =>
      (
        await api.get('/minutes', {
          params: {
            search: search || undefined,
            year: year || undefined,
            month: month || undefined,
            type: type || undefined,
            secretary: secretary || undefined,
            status: status || undefined,
            tag: tag || undefined,
          },
        })
      ).data,
  })
  const { data: allMinutes } = useQuery<MinuteRow[]>({
    queryKey: ['minutes', 'all'],
    queryFn: async () => (await api.get('/minutes')).data,
  })
  const { data: stats } = useQuery<MinuteStats>({
    queryKey: ['minutes-stats'],
    queryFn: async () => (await api.get('/minutes/stats')).data,
  })

  const filterOptions = useMemo(() => {
    const years = new Set<number>()
    const secretaries = new Set<string>()
    const tags = new Set<string>()
    for (const m of allMinutes ?? []) {
      years.add(new Date(m.sessionDate).getFullYear())
      if (m.secretary) secretaries.add(m.secretary)
      for (const t of m.tags) tags.add(t)
    }
    return {
      years: Array.from(years).sort((a, b) => b - a),
      secretaries: Array.from(secretaries).sort(),
      tags: Array.from(tags).sort(),
    }
  }, [allMinutes])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['minutes'] })
    queryClient.invalidateQueries({ queryKey: ['minutes-stats'] })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/minutes/${id}`),
    onSuccess: (_res, id) => {
      invalidateAll()
      if (viewId === id) setViewId(null)
      setDeleteTarget(null)
    },
  })

  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setYear(''); setMonth(''); setType(''); setSecretary(''); setStatus(''); setTag('')
  }

  const openCreate = () => { setEditingId(null); setShowForm(true) }
  const openEdit = (id: string) => { setEditingId(id); setShowForm(true) }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
          <BookOpen size={19} />
        </span>
        <div>
          <Eyebrow>COMITÉ DE INNOVACIÓN</Eyebrow>
          <h1 className="text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">Actas</h1>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[13px]"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={15} /> Nueva acta
          </button>
        )}
      </div>
      <p className="text-[13px] text-muted mt-1.5 mb-5 max-w-[680px]">
        Biblioteca documental de actas del Comité de Innovación: antecedentes, PDF asociado, acuerdos y seguimiento de compromisos.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Kpi value={String(stats?.total ?? 0)} label="Total actas" icon={<BookOpen size={17} />} accentBar="var(--accent)" />
        <Kpi value={String(stats?.actasThisYear ?? 0)} label={`Actas ${new Date().getFullYear()}`} icon={<CalendarDays size={17} />} accentBar="var(--blue-500)" />
        <Kpi
          value={stats?.lastMinute ? fmtDate(stats.lastMinute.sessionDate) : '—'}
          label={stats?.lastMinute ? `Última: ${stats.lastMinute.title}` : 'Sin actas todavía'}
          icon={<Clock size={17} />}
          accentBar="var(--violet-500)"
        />
        <Kpi value={String(stats?.totalAgreements ?? 0)} label="Acuerdos registrados" icon={<ClipboardList size={17} />} accentBar="var(--green-500)" />
        <Kpi value={String(stats?.pendingCommitments ?? 0)} label="Compromisos pendientes" icon={<AlertTriangle size={17} />} accentBar="var(--amber-500)" />
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título, responsable, participante, acuerdo, resumen…"
            className="h-9 w-[280px] pl-8 pr-3 rounded-full border border-line bg-card text-[12.5px] outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px]">
          <option value="">Año</option>
          {filterOptions.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} disabled={!year} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px] disabled:opacity-50">
          <option value="">Mes</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px]">
          <option value="">Tipo</option>
          <option value="ORDINARIA">Ordinaria</option>
          <option value="EXTRAORDINARIA">Extraordinaria</option>
        </select>
        <select value={secretary} onChange={(e) => setSecretary(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px]">
          <option value="">Responsable</option>
          {filterOptions.secretaries.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px]">
          <option value="">Estado</option>
          {(Object.keys(STATUS_META) as MinuteStatusValue[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className="h-9 px-2.5 rounded-md border border-line bg-card text-[12px]">
          <option value="">Etiqueta</option>
          {filterOptions.tags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-line rounded-card p-4 animate-pulse h-[170px]" />
          ))}
        </div>
      )}

      {!isLoading && (minutes?.length ?? 0) === 0 && !hasActiveFilters && (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No hay actas registradas todavía"
          description='Comienza subiendo la primera acta del Comité de Innovación. Podrás registrar antecedentes, asociar el PDF y dar seguimiento a los acuerdos.'
          action={canManage && (
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-white font-semibold text-[13px]" style={{ background: 'var(--accent)' }}>
              <Plus size={15} /> Nueva acta
            </button>
          )}
        />
      )}

      {!isLoading && (minutes?.length ?? 0) === 0 && hasActiveFilters && (
        <div className="bg-card border border-line rounded-card p-8 text-center">
          <p className="text-[12.5px] text-muted mb-2">Sin resultados para estos filtros.</p>
          <button onClick={clearFilters} className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>Limpiar filtros</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {minutes?.map((m) => (
          <MinuteCard
            key={m.id}
            minute={m}
            canManage={canManage}
            onView={() => setViewId(m.id)}
            onEdit={() => openEdit(m.id)}
            onDelete={() => setDeleteTarget(m)}
          />
        ))}
      </div>

      <MinuteViewModal
        open={!!viewId}
        minuteId={viewId}
        canManage={canManage}
        onClose={() => setViewId(null)}
        onEdit={(id) => { setViewId(null); openEdit(id) }}
      />

      <MinuteFormModal
        open={showForm}
        editingId={editingId}
        onClose={() => setShowForm(false)}
        onSaved={invalidateAll}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar acta" maxWidth={440}>
        {deleteTarget && (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
                <AlertTriangle size={17} />
              </span>
              <p className="text-[13px] text-body leading-relaxed">
                ¿Eliminar el acta <strong className="text-ink">"{deleteTarget.title}"</strong>? Se eliminarán también sus acuerdos asociados.
                Esta acción no se puede deshacer.
              </p>
            </div>
            {deleteMutation.error && <p className="text-[11.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(deleteMutation.error)}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="h-9 px-4 rounded-md border border-line text-[12.5px] font-semibold text-body">
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="h-9 px-4 rounded-md text-white text-[12.5px] font-semibold disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function MinuteCard({ minute, canManage, onView, onEdit, onDelete }: {
  minute: MinuteRow
  canManage: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const visibleTags = minute.tags.slice(0, 3)
  return (
    <button
      onClick={onView}
      className="text-left bg-card border border-line rounded-card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover flex flex-col"
    >
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[minute.status].tone, background: STATUS_META[minute.status].bg }}>
          {STATUS_META[minute.status].label}
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: minute.isExtraordinary ? 'var(--accent-700)' : 'var(--blue-600)', background: minute.isExtraordinary ? 'var(--accent-50)' : 'var(--blue-50)' }}>
          {minute.isExtraordinary ? 'Extraordinaria' : 'Ordinaria'}
        </span>
        <span
          className="ml-auto shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
          style={minute.documentUpload ? { color: 'var(--accent)', background: 'var(--accent-50)' } : { color: 'var(--text-subtle)', background: 'var(--surface-sunken)' }}
          title={minute.documentUpload ? 'PDF asociado' : 'Sin PDF asociado'}
        >
          <FileText size={14} />
        </span>
      </div>
      <div className="text-[14px] font-bold text-ink leading-snug mb-1">{minute.title}</div>
      <div className="flex items-center gap-1 text-[11.5px] text-muted mb-1 flex-wrap">
        <CalendarDays size={11} className="text-subtle" /> {fmtDate(minute.sessionDate)}
        {minute.secretary && (<><span className="text-subtle">·</span><User size={11} className="text-subtle" /> {minute.secretary}</>)}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {visibleTags.map((t) => (
          <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: 'var(--violet-600)', background: 'var(--violet-50)' }}>{t}</span>
        ))}
        {minute.tags.length > 3 && <span className="text-[10px] text-subtle">+{minute.tags.length - 3}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-line">
        <Badge>{minute._count.agreements} acuerdos</Badge>
        <div className="flex items-center gap-1">
          <span title="Ver" className="w-7 h-7 flex items-center justify-center rounded-md text-muted">
            <Eye size={14} />
          </span>
          {canManage && (
            <>
              <span
                title="Editar"
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body"
              >
                <Pencil size={13} />
              </span>
              <span
                title="Eliminar"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-line hover:border-[var(--accent)] text-body"
              >
                <Trash2 size={13} />
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

function MinuteViewModal({ open, minuteId, canManage, onClose, onEdit }: {
  open: boolean
  minuteId: string | null
  canManage: boolean
  onClose: () => void
  onEdit: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const [showNewAgreement, setShowNewAgreement] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  const { data: detail } = useQuery<MinuteDetail>({
    queryKey: ['minute', minuteId],
    queryFn: async () => (await api.get(`/minutes/${minuteId}`)).data,
    enabled: open && !!minuteId,
  })

  useEffect(() => {
    setPdfUrl(null)
    setPdfStatus('idle')
    if (!open || !detail?.documentUpload) return
    let cancelled = false
    let url: string | null = null
    setPdfStatus('loading')
    previewUpload(detail.documentUpload.id)
      .then((u) => {
        if (cancelled) { URL.revokeObjectURL(u); return }
        url = u
        setPdfUrl(u)
        setPdfStatus('ready')
      })
      .catch(() => { if (!cancelled) setPdfStatus('error') })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [open, detail?.documentUpload?.id])

  useEffect(() => { if (!open) setShowNewAgreement(false) }, [open])

  const createAgreement = useMutation({
    mutationFn: (data: { description: string; responsible: string }) => api.post(`/minutes/${minuteId}/agreements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minute', minuteId] })
      queryClient.invalidateQueries({ queryKey: ['minutes'] })
      queryClient.invalidateQueries({ queryKey: ['minutes-stats'] })
      setShowNewAgreement(false)
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={detail?.title ?? 'Acta'} maxWidth={780}>
      {!detail ? (
        <p className="text-[12.5px] text-muted">Cargando…</p>
      ) : (
        <div>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[detail.status].tone, background: STATUS_META[detail.status].bg }}>
              {STATUS_META[detail.status].label}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: detail.isExtraordinary ? 'var(--accent-700)' : 'var(--blue-600)', background: detail.isExtraordinary ? 'var(--accent-50)' : 'var(--blue-50)' }}>
              {detail.isExtraordinary ? 'Extraordinaria' : 'Ordinaria'}
            </span>
            {detail.tags.map((t) => (
              <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: 'var(--violet-600)', background: 'var(--violet-50)' }}>{t}</span>
            ))}
            {canManage && (
              <button onClick={() => onEdit(detail.id)} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11.5px] text-muted mb-4 p-3 rounded-[10px] bg-inset">
            <div><strong className="text-ink">Fecha:</strong> {fmtDate(detail.sessionDate)}</div>
            <div><strong className="text-ink">Responsable:</strong> {detail.secretary ?? '—'}</div>
            <div><strong className="text-ink">Participantes:</strong> {detail.participants.length || detail.attendeesCount}</div>
          </div>

          {detail.participants.length > 0 && (
            <div className="mb-3.5">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Users size={11} /> Participantes</h4>
              <p className="text-[12.5px] text-body">{detail.participants.join(', ')}</p>
            </div>
          )}
          {detail.summary && (
            <div className="mb-3.5">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5">Resumen ejecutivo</h4>
              <p className="text-[13px] text-body leading-relaxed">{detail.summary}</p>
            </div>
          )}
          {detail.keyAgreementsNote && (
            <div className="mb-3.5">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5">Acuerdos principales</h4>
              <p className="text-[13px] text-body leading-relaxed">{detail.keyAgreementsNote}</p>
            </div>
          )}
          {detail.commitments && (
            <div className="mb-3.5">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5">Compromisos</h4>
              <p className="text-[13px] text-body leading-relaxed">{detail.commitments}</p>
            </div>
          )}
          {detail.observations && (
            <div className="mb-3.5">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide mb-1.5">Observaciones</h4>
              <p className="text-[13px] text-body leading-relaxed">{detail.observations}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h4 className="text-[11px] font-bold text-subtle uppercase tracking-wide flex items-center gap-1.5"><FileText size={11} /> Documento PDF</h4>
              {detail.documentUpload && (
                <div className="flex items-center gap-3 flex-wrap">
                  {pdfStatus === 'ready' && pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      <ExternalLink size={13} /> Abrir en nueva pestaña
                    </a>
                  )}
                  <button
                    onClick={() => downloadUpload(detail.documentUpload!.id, detail.documentUpload!.originalName)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Download size={13} /> Descargar {formatBytes(detail.documentUpload.sizeBytes) ? `(${formatBytes(detail.documentUpload.sizeBytes)})` : ''}
                  </button>
                </div>
              )}
            </div>
            {detail.documentUpload ? (
              <>
                {pdfStatus === 'ready' && pdfUrl && (
                  <iframe
                    title="Vista previa del acta"
                    src={pdfUrl}
                    className="w-full rounded-[10px] border border-line"
                    style={{ height: 'min(70vh, 560px)' }}
                  />
                )}
                {(pdfStatus === 'idle' || pdfStatus === 'loading') && (
                  <div className="h-[200px] sm:h-[260px] rounded-[10px] border border-line bg-inset flex flex-col items-center justify-center gap-2 text-[12px] text-muted">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    Cargando vista previa…
                  </div>
                )}
                {pdfStatus === 'error' && (
                  <div className="h-[200px] sm:h-[260px] rounded-[10px] border border-line bg-inset flex flex-col items-center justify-center gap-2.5 text-center px-4">
                    <FileWarning size={22} style={{ color: 'var(--accent)' }} />
                    <p className="text-[12.5px] text-muted">No fue posible visualizar el documento PDF.</p>
                    <button
                      onClick={() => downloadUpload(detail.documentUpload!.id, detail.documentUpload!.originalName)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-white font-semibold text-[12px]"
                      style={{ background: 'var(--accent)' }}
                    >
                      <Download size={13} /> Descargar PDF
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-[80px] rounded-[10px] border border-dashed border-line bg-inset flex items-center justify-center text-[12px] text-muted">
                Sin PDF asociado a esta acta.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-[13.5px] text-ink font-bold flex items-center gap-1.5"><ClipboardList size={14} /> Acuerdos y seguimiento</h4>
            {canManage && (
              <button onClick={() => setShowNewAgreement((v) => !v)} className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                {showNewAgreement ? 'Cancelar' : '+ Agregar acuerdo'}
              </button>
            )}
          </div>

          {showNewAgreement && (
            <form
              className="flex flex-col gap-2 mb-3.5 p-3 rounded-[11px] border border-line bg-inset"
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const description = (form.elements.namedItem('description') as HTMLInputElement).value
                const responsible = (form.elements.namedItem('responsible') as HTMLInputElement).value
                if (description && responsible) createAgreement.mutate({ description, responsible })
              }}
            >
              <input name="description" placeholder="Descripción del acuerdo" className="h-9 px-2.5 rounded-md border border-line bg-card text-[12.5px]" required />
              <input name="responsible" placeholder="Responsable" className="h-9 px-2.5 rounded-md border border-line bg-card text-[12.5px]" required />
              <button type="submit" disabled={createAgreement.isPending} className="h-8 rounded-md text-white font-semibold text-[12px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                Guardar
              </button>
              {createAgreement.error && <p className="text-[11px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createAgreement.error)}</p>}
            </form>
          )}

          <div className="flex flex-col gap-2.5">
            {detail.agreements.length === 0 && <p className="text-[12.5px] text-muted">Sin acuerdos registrados.</p>}
            {detail.agreements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 sm:px-[15px] rounded-[11px] bg-inset border border-line">
                <span className="w-[11px] h-[11px] shrink-0 rounded-full" style={{ background: STATE_COLOR[a.state] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-ink font-medium leading-snug">{a.description}</div>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    {a.responsible}{a.dueDate ? ` · vence ${new Date(a.dueDate).toLocaleDateString('es-CL')}` : ''}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-semibold font-mono" style={{ color: STATE_COLOR[a.state] }}>{a.state}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

const PDF_MAX_BYTES = 10 * 1024 * 1024

function MinuteFormModal({ open, editingId, onClose, onSaved }: {
  open: boolean
  editingId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const { data: editing } = useQuery<MinuteDetail>({
    queryKey: ['minute', editingId],
    queryFn: async () => (await api.get(`/minutes/${editingId}`)).data,
    enabled: open && !!editingId,
  })

  useEffect(() => { if (open) { setFile(null); setFileError(null) } }, [open, editingId])

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      let documentUploadId: string | undefined
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const upload = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        documentUploadId = upload.data.id
      }
      const body = { ...payload, ...(documentUploadId ? { documentUploadId } : {}) }
      return editingId ? api.patch(`/minutes/${editingId}`, body) : api.post('/minutes', body)
    },
    onSuccess: () => {
      onSaved()
      if (editingId) queryClient.invalidateQueries({ queryKey: ['minute', editingId] })
      onClose()
    },
  })

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f && f.type !== 'application/pdf') { setFileError('Solo se permiten archivos PDF.'); setFile(null); e.target.value = ''; return }
    if (f && f.size > PDF_MAX_BYTES) { setFileError('El archivo no puede superar 10 MB.'); setFile(null); e.target.value = ''; return }
    setFileError(null)
    setFile(f)
  }

  const loadingEdit = !!editingId && !editing

  return (
    <Modal open={open} onClose={onClose} title={editingId ? 'Editar acta' : 'Nueva acta'} maxWidth={680}>
      {loadingEdit ? (
        <p className="text-[12.5px] text-muted">Cargando…</p>
      ) : (
        <form
          key={editingId ?? 'new'}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? ''
            const title = get('title')
            const sessionDate = get('sessionDate')
            if (!title || !sessionDate) return
            const participants = splitList(get('participants'))
            saveMutation.mutate({
              title,
              sessionDate,
              isExtraordinary: get('type') === 'EXTRAORDINARIA',
              status: get('status'),
              secretary: get('secretary') || undefined,
              participants,
              attendeesCount: participants.length,
              tags: splitList(get('tags')),
              summary: get('summary') || undefined,
              keyAgreementsNote: get('keyAgreementsNote') || undefined,
              commitments: get('commitments') || undefined,
              observations: get('observations') || undefined,
            })
          }}
        >
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Título</span>
            <input name="title" defaultValue={editing?.title} required className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Fecha de reunión</span>
            <input name="sessionDate" type="date" defaultValue={editing?.sessionDate?.slice(0, 10)} required className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Tipo de reunión</span>
            <select name="type" defaultValue={editing?.isExtraordinary ? 'EXTRAORDINARIA' : 'ORDINARIA'} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
              <option value="ORDINARIA">Ordinaria</option>
              <option value="EXTRAORDINARIA">Extraordinaria</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Responsable / Secretario</span>
            <input name="secretary" defaultValue={editing?.secretary ?? ''} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-body">Estado</span>
            <select name="status" defaultValue={editing?.status ?? 'PUBLICADA'} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]">
              {(Object.keys(STATUS_META) as MinuteStatusValue[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Participantes (separados por coma)</span>
            <input name="participants" defaultValue={editing?.participants.join(', ') ?? ''} placeholder="Ej: María Pérez, Juan Soto" className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Etiquetas (separadas por coma)</span>
            <input name="tags" defaultValue={editing?.tags.join(', ') ?? ''} placeholder="Ej: gestión clínica, presupuesto" className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Resumen ejecutivo</span>
            <textarea name="summary" defaultValue={editing?.summary ?? ''} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Acuerdos principales (síntesis)</span>
            <textarea name="keyAgreementsNote" defaultValue={editing?.keyAgreementsNote ?? ''} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Compromisos</span>
            <textarea name="commitments" defaultValue={editing?.commitments ?? ''} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">Observaciones</span>
            <textarea name="observations" defaultValue={editing?.observations ?? ''} rows={2} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[12px] font-semibold text-body">
              Archivo PDF {editing?.documentUpload ? `— actual: ${editing.documentUpload.originalName} (sube uno nuevo para reemplazarlo)` : '(opcional)'}
            </span>
            <input type="file" accept="application/pdf" onChange={onFileChange} className="text-[12.5px]" />
            {fileError && <span className="text-[11px]" style={{ color: 'var(--accent)' }}>{fileError}</span>}
          </label>

          {saveMutation.error && <p className="sm:col-span-2 text-[12px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveMutation.error)}</p>}

          <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-line text-[13px] font-semibold text-body">Cancelar</button>
            <button type="submit" disabled={saveMutation.isPending} className="h-10 px-4 rounded-md text-white font-semibold text-[13px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
