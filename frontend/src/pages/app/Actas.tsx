import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

interface MinuteRow {
  id: string
  title: string
  sessionDate: string
  attendeesCount: number
  _count: { agreements: number }
}
interface Agreement {
  id: string
  description: string
  responsible: string
  dueDate: string | null
  state: 'PENDIENTE' | 'EN_CURSO' | 'CUMPLIDO' | 'VENCIDO'
}
interface MinuteDetail extends MinuteRow {
  attendeeInitials: string[]
  agreements: Agreement[]
}

const STATE_COLOR: Record<Agreement['state'], string> = {
  PENDIENTE: 'var(--accent)',
  EN_CURSO: 'var(--amber-500)',
  CUMPLIDO: 'var(--green-500)',
  VENCIDO: 'var(--accent)',
}

export default function Actas() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('minutes.manage')
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewMinute, setShowNewMinute] = useState(false)
  const [showNewAgreement, setShowNewAgreement] = useState(false)

  const { data: minutes } = useQuery<MinuteRow[]>({
    queryKey: ['minutes'],
    queryFn: async () => (await api.get('/minutes')).data,
  })
  const activeId = selectedId ?? minutes?.[0]?.id ?? null

  const { data: detail } = useQuery<MinuteDetail>({
    queryKey: ['minute', activeId],
    queryFn: async () => (await api.get(`/minutes/${activeId}`)).data,
    enabled: !!activeId,
  })

  const createMinute = useMutation({
    mutationFn: (data: { title: string; sessionDate: string }) => api.post('/minutes', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['minutes'] })
      setSelectedId(res.data.id)
      setShowNewMinute(false)
    },
  })
  const createAgreement = useMutation({
    mutationFn: (data: { description: string; responsible: string }) => api.post(`/minutes/${activeId}/agreements`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minute', activeId] })
      setShowNewAgreement(false)
    },
  })

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4.5 gap-5 items-start animate-viewin">
      {/* Lista de actas */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h1 className="text-xl text-ink tracking-tight font-extrabold">Actas</h1>
          {canManage && (
            <button
              onClick={() => setShowNewMinute((v) => !v)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-white font-semibold text-[12.5px]"
              style={{ background: 'var(--accent)' }}
            >
              {showNewMinute ? <X size={14} /> : <Plus size={14} />} {showNewMinute ? 'Cerrar' : 'Nueva'}
            </button>
          )}
        </div>

        {showNewMinute && (
          <form
            className="bg-card border border-line rounded-[11px] p-3 mb-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              const title = (form.elements.namedItem('title') as HTMLInputElement).value
              const sessionDate = (form.elements.namedItem('sessionDate') as HTMLInputElement).value
              if (title && sessionDate) createMinute.mutate({ title, sessionDate })
            }}
          >
            <input name="title" placeholder="Título de la sesión" className="h-9 px-2.5 rounded-md border border-line bg-inset text-[12.5px]" required />
            <input name="sessionDate" type="date" className="h-9 px-2.5 rounded-md border border-line bg-inset text-[12.5px]" required />
            <button type="submit" disabled={createMinute.isPending} className="h-8 rounded-md text-white font-semibold text-[12px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
              {createMinute.isPending ? 'Creando…' : 'Crear acta'}
            </button>
            {createMinute.error && <p className="text-[11px]" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMinute.error)}</p>}
          </form>
        )}

        <div className="flex flex-col gap-2">
          {minutes?.length === 0 && <p className="text-[12.5px] text-muted">Sin actas registradas.</p>}
          {minutes?.map((a) => {
            const on = a.id === activeId
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className="flex flex-col gap-1 p-3.5 rounded-[11px] text-left border transition-colors"
                style={on ? { background: 'var(--accent-50)', borderColor: 'var(--accent-100)' } : { background: 'var(--surface-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] text-muted">{new Date(a.sessionDate).toLocaleDateString('es-CL')}</span>
                  <span className="font-mono text-[10px] px-[7px] rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}>
                    {a._count.agreements} acuerdos
                  </span>
                </div>
                <div className="text-sm font-bold text-ink">{a.title}</div>
                <div className="text-xs text-muted">{a.attendeesCount} participantes</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle de acta */}
      {detail ? (
        <div className="bg-card border border-line rounded-card p-5 sm:p-[26px]">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>
                {new Date(detail.sessionDate).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <h2 className="mt-1.5 text-[20px] sm:text-[23px] text-ink tracking-tight font-bold">{detail.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 my-5 sm:my-6 flex-wrap">
            <span className="font-mono text-[10px] tracking-wider text-subtle">PARTICIPANTES</span>
            <div className="flex">
              {detail.attendeeInitials.map((ini, i) => (
                <span key={i} className="w-[30px] h-[30px] rounded-full bg-sunken border-2 border-card text-body flex items-center justify-center text-[10px] font-bold font-mono" style={{ marginLeft: i === 0 ? 0 : -7 }}>
                  {ini}
                </span>
              ))}
              {detail.attendeeInitials.length === 0 && <span className="text-[12px] text-muted">Sin registrar</span>}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] text-ink font-bold">Acuerdos y seguimiento</h3>
            {canManage && (
              <button onClick={() => setShowNewAgreement((v) => !v)} className="text-[12px] font-semibold" style={{ color: 'var(--accent)' }}>
                {showNewAgreement ? 'Cancelar' : '+ Agregar acuerdo'}
              </button>
            )}
          </div>

          {showNewAgreement && (
            <form
              className="flex flex-col gap-2 mb-4 p-3 rounded-[11px] border border-line bg-inset"
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
            </form>
          )}

          <div className="flex flex-col gap-2.5 mb-2">
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
      ) : (
        <div className="bg-card border border-line rounded-card p-8 text-center text-[13px] text-muted">
          No hay actas todavía{canManage ? ' — crea la primera con "Nueva".' : '.'}
        </div>
      )}
    </div>
  )
}
