import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

type Status = 'EN_DISENO' | 'PROGRAMADA' | 'ACTIVA' | 'FINALIZADA'

interface Communication {
  id: string
  title: string
  channel: string
  status: Status
  scheduledAt: string | null
}

const STATUS_META: Record<Status, { label: string; tone: string; bg: string }> = {
  EN_DISENO: { label: 'En diseño', tone: 'var(--amber-600)', bg: 'var(--amber-50)' },
  PROGRAMADA: { label: 'Programada', tone: 'var(--blue-600)', bg: 'var(--blue-50)' },
  ACTIVA: { label: 'Activa', tone: 'var(--green-600)', bg: 'var(--green-50)' },
  FINALIZADA: { label: 'Finalizada', tone: 'var(--slate-500)', bg: 'var(--slate-100)' },
}

export default function Comunicaciones() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('communications.manage')
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data } = useQuery<Communication[]>({
    queryKey: ['communications'],
    queryFn: async () => (await api.get('/communications')).data,
  })

  const counters = useMemo(() => {
    const list = data ?? []
    return {
      total: list.length,
      activas: list.filter((c) => c.status === 'ACTIVA').length,
      programadas: list.filter((c) => c.status === 'PROGRAMADA').length,
      enDiseno: list.filter((c) => c.status === 'EN_DISENO').length,
    }
  }, [data])

  const calendar = useMemo(() => {
    const withDate = (data ?? []).filter((c) => c.scheduledAt)
    const map = new Map<string, Communication[]>()
    for (const c of withDate) {
      const key = new Date(c.scheduledAt!).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short' })
      map.set(key, [...(map.get(key) ?? []), c])
    }
    return Array.from(map.entries())
  }, [data])

  const createMutation = useMutation({
    mutationFn: (values: { title: string; channel: string; scheduledAt?: string }) => api.post('/communications', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['communications'] }); setShowForm(false) },
  })

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <Eyebrow>PLAN COMUNICACIONAL</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
            Comunicaciones del Comité
          </h1>
        </div>
        {canManage && (
          <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-white font-semibold text-[13px]" style={{ background: 'var(--accent)' }}>
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Cerrar' : 'Nueva campaña'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4.5 mb-5">
        {[
          { v: counters.total, l: 'Comunicaciones totales' },
          { v: counters.activas, l: 'Activas' },
          { v: counters.programadas, l: 'Programadas' },
          { v: counters.enDiseno, l: 'En diseño' },
        ].map((m) => (
          <div key={m.l} className="bg-card border border-line rounded-card p-4.5 p-[18px]">
            <div className="font-mono text-[24px] sm:text-[26px] font-bold text-ink leading-none">{m.v}</div>
            <div className="text-[13px] text-body mt-1.5 font-semibold">{m.l}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          className="bg-card border border-line rounded-card p-4 mb-5 grid grid-cols-1 sm:grid-cols-4 gap-2.5"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const title = (form.elements.namedItem('title') as HTMLInputElement).value
            const channel = (form.elements.namedItem('channel') as HTMLInputElement).value
            const scheduledAt = (form.elements.namedItem('scheduledAt') as HTMLInputElement).value
            if (title && channel) createMutation.mutate({ title, channel, scheduledAt: scheduledAt || undefined })
          }}
        >
          <input name="title" placeholder="Título de la campaña" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px] sm:col-span-2" required />
          <input name="channel" placeholder="Canal (ej: Email · Intranet)" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" required />
          <input name="scheduledAt" type="date" className="h-9 px-3 rounded-md border border-line bg-inset text-[13px]" />
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] sm:col-span-4 sm:w-fit disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            {createMutation.isPending ? 'Creando…' : 'Crear'}
          </button>
          {createMutation.error && <p className="text-[11px] sm:col-span-4" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error)}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        {/* Calendario editorial */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-4 font-bold">Calendario editorial</h3>
          {calendar.length === 0 && <p className="text-[12.5px] text-muted">Sin comunicaciones programadas con fecha.</p>}
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {calendar.map(([day, items]) => (
              <div key={day} className="flex-1 min-w-[130px]">
                <div className="font-mono text-[11px] text-muted text-center pb-2.5 border-b border-line mb-2.5 capitalize">{day}</div>
                <div className="flex flex-col gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="text-xs text-ink bg-inset rounded-[7px] px-2.5 py-2.5 leading-tight" style={{ borderLeft: `3px solid ${STATUS_META[it.status].tone}` }}>
                      {it.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campañas */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Todas las campañas</h3>
          <div className="flex flex-col gap-3">
            {data?.length === 0 && <p className="text-[12.5px] text-muted">Sin campañas registradas.</p>}
            {data?.map((c) => (
              <div key={c.id} className="p-3.5 rounded-[11px] border border-line">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[13.5px] font-semibold text-ink leading-snug">{c.title}</span>
                  <span className="shrink-0 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: STATUS_META[c.status].tone, background: STATUS_META[c.status].bg }}>
                    {STATUS_META[c.status].label}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-muted">{c.channel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
