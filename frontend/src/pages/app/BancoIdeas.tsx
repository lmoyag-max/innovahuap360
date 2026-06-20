import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

type IdeaStatus = 'RECIBIDA' | 'EN_TRIAGE' | 'APROBADA' | 'RECHAZADA' | 'CONVERTIDA'

interface Idea {
  id: string
  title: string
  description: string
  proponentName: string
  unit: string | null
  scope: string | null
  status: IdeaStatus
  triageNote: string | null
  createdAt: string
}

const STATUS_META: Record<IdeaStatus, { label: string; tone: string; bg: string }> = {
  RECIBIDA: { label: 'Recibida', tone: 'var(--blue-600)', bg: 'var(--blue-50)' },
  EN_TRIAGE: { label: 'En triage', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  APROBADA: { label: 'Aprobada', tone: 'var(--green-600)', bg: 'var(--green-50)' },
  RECHAZADA: { label: 'Rechazada', tone: 'var(--accent-700)', bg: 'var(--accent-50)' },
  CONVERTIDA: { label: 'Convertida a proyecto', tone: 'var(--violet-600)', bg: 'var(--violet-50)' },
}

const FILTERS: { label: string; value: IdeaStatus | 'TODAS' }[] = [
  { label: 'Todas', value: 'TODAS' },
  { label: 'Recibidas', value: 'RECIBIDA' },
  { label: 'En triage', value: 'EN_TRIAGE' },
  { label: 'Aprobadas', value: 'APROBADA' },
  { label: 'Rechazadas', value: 'RECHAZADA' },
  { label: 'Convertidas', value: 'CONVERTIDA' },
]

export default function BancoIdeas() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('ideas.manage')
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<IdeaStatus | 'TODAS'>('TODAS')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: ideas, isLoading } = useQuery<Idea[]>({
    queryKey: ['ideas', filter],
    queryFn: async () => (await api.get('/ideas', { params: filter === 'TODAS' ? undefined : { status: filter } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ideas'] })

  const triageMutation = useMutation({
    mutationFn: ({ id, status, triageNote }: { id: string; status: IdeaStatus; triageNote?: string }) =>
      api.patch(`/ideas/${id}`, { status, triageNote }),
    onSuccess: invalidate,
  })
  const convertMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ideas/${id}/convert-to-project`),
    onSuccess: invalidate,
  })

  const counts = ideas?.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1
    return acc
  }, {})

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
      <p className="text-[13px] text-muted mt-1.5 mb-5 max-w-[640px]">
        Ideas postuladas por la comunidad a través del portal público (<code className="font-mono">/postula</code>). El Comité revisa,
        decide y puede convertir las aprobadas en un proyecto formal del portafolio.
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="text-[12.5px] px-3 py-1.5 rounded-full border transition-colors"
            style={
              filter === f.value
                ? { color: 'var(--accent)', background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }
                : { color: 'var(--text-body)', background: 'var(--surface-sunken)', borderColor: 'var(--border)' }
            }
          >
            {f.label}{f.value !== 'TODAS' && counts?.[f.value] ? ` (${counts[f.value]})` : ''}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && <p className="text-[12.5px] text-muted">Cargando…</p>}
        {ideas?.length === 0 && <p className="text-[12.5px] text-muted">No hay ideas en este estado.</p>}
        {ideas?.map((idea) => {
          const open = expandedId === idea.id
          return (
            <div key={idea.id} className="bg-card border border-line rounded-card p-4 sm:p-[18px]">
              <button onClick={() => setExpandedId(open ? null : idea.id)} className="w-full text-left flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[idea.status].tone, background: STATUS_META[idea.status].bg }}>
                      {STATUS_META[idea.status].label}
                    </span>
                    {idea.scope && <span className="text-[11px] text-muted">{idea.scope}</span>}
                  </div>
                  <div className="text-[14.5px] font-semibold text-ink leading-snug">{idea.title}</div>
                  <div className="text-[11.5px] text-muted mt-0.5">
                    {idea.proponentName}{idea.unit ? ` · ${idea.unit}` : ''} · {new Date(idea.createdAt).toLocaleDateString('es-CL')}
                  </div>
                </div>
              </button>

              {open && (
                <div className="mt-3.5 pt-3.5 border-t border-line">
                  <p className="text-[13px] text-body leading-relaxed mb-3.5">{idea.description}</p>
                  {idea.triageNote && (
                    <p className="text-[12px] text-muted italic mb-3.5">Nota de triage: {idea.triageNote}</p>
                  )}
                  {canManage && idea.status !== 'CONVERTIDA' && (
                    <div className="flex flex-wrap gap-2">
                      {idea.status !== 'EN_TRIAGE' && (
                        <button onClick={() => triageMutation.mutate({ id: idea.id, status: 'EN_TRIAGE' })} className="text-[12px] font-semibold px-3 py-1.5 rounded-md border border-line text-body">
                          Marcar en triage
                        </button>
                      )}
                      {idea.status !== 'APROBADA' && (
                        <button onClick={() => triageMutation.mutate({ id: idea.id, status: 'APROBADA' })} className="text-[12px] font-semibold px-3 py-1.5 rounded-md" style={{ color: 'var(--green-600)', background: 'var(--green-50)' }}>
                          Aprobar
                        </button>
                      )}
                      {idea.status !== 'RECHAZADA' && (
                        <button onClick={() => triageMutation.mutate({ id: idea.id, status: 'RECHAZADA' })} className="text-[12px] font-semibold px-3 py-1.5 rounded-md" style={{ color: 'var(--accent-700)', background: 'var(--accent-50)' }}>
                          Rechazar
                        </button>
                      )}
                      {idea.status === 'APROBADA' && (
                        <button
                          onClick={() => convertMutation.mutate(idea.id)}
                          disabled={convertMutation.isPending}
                          className="text-[12px] font-bold px-3 py-1.5 rounded-md text-white inline-flex items-center gap-1.5 disabled:opacity-60"
                          style={{ background: 'var(--accent)' }}
                        >
                          Convertir en proyecto <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  {(triageMutation.error || convertMutation.error) && (
                    <p className="text-[11px] mt-2" style={{ color: 'var(--accent)' }}>
                      {apiErrorMessage(triageMutation.error ?? convertMutation.error)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
