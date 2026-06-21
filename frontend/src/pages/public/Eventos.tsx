import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/PageHeader'
import { api } from '../../lib/api'
import { eventos } from '../../data/public'

interface EventoItem {
  id: string
  title: string
  category: string | null
  itemType: string | null
  eventDate: string | null
  eventLocation: string | null
  registrationUrl: string | null
}

const PALETTE = ['var(--accent)', 'var(--blue-500)', 'var(--violet-500)', 'var(--green-500)', 'var(--amber-600)']

function dayMonth(iso: string | null) {
  if (!iso) return { day: '--', mon: '' }
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('es-CL', { day: '2-digit' }).format(d)
  const mon = new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(d).replace('.', '').toUpperCase()
  return { day, mon }
}

function time(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function Eventos() {
  const { data, isLoading, isError } = useQuery<EventoItem[]>({
    queryKey: ['public-eventos'],
    queryFn: async () => (await api.get('/public-content', { params: { section: 'EVENTOS' } })).data,
    retry: 1,
  })

  const useFallback = isError || (!isLoading && (data?.length ?? 0) === 0)
  const items = useFallback
    ? eventos.map((e) => ({
        id: e.title,
        title: e.title,
        type: e.type,
        color: e.tc,
        day: e.day,
        mon: e.mon,
        time: e.time,
        place: e.place,
        registrationUrl: null as string | null,
      }))
    : (data ?? []).map((e, i) => {
        const { day, mon } = dayMonth(e.eventDate)
        return {
          id: e.id,
          title: e.title,
          type: e.category ?? e.itemType ?? '',
          color: PALETTE[i % PALETTE.length],
          day,
          mon,
          time: time(e.eventDate),
          place: e.eventLocation ?? '',
          registrationUrl: e.registrationUrl,
        }
      })

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader
        eyebrow="EVENTOS Y ACTIVIDADES"
        title="Jornadas, seminarios y convocatorias"
        intro="Participa en la agenda de innovación del HUAP. Abierta a funcionarios, usuarios y colaboradores."
      />
      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-muted bg-inset border border-line rounded-card px-4 py-3">No hay eventos publicados por ahora.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-4 sm:gap-5 bg-card border border-line rounded-card p-4 sm:px-[22px] sm:py-[18px] transition-colors hover:border-line-strong"
            >
              <div className="w-14 sm:w-16 shrink-0 text-center sm:border-r border-line sm:pr-[18px]">
                <div className="font-mono text-[22px] sm:text-[26px] font-bold leading-none" style={{ color: e.color }}>
                  {e.day}
                </div>
                <div className="font-mono text-[11px] text-muted mt-0.5">{e.mon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] sm:text-base font-bold text-ink leading-snug">{e.title}</div>
                <div className="font-mono text-xs text-muted mt-1">{e.time} · {e.place}</div>
              </div>
              <span
                className="hidden sm:inline-flex shrink-0 text-[11.5px] font-semibold px-3 py-1.5 rounded-full bg-sunken"
                style={{ color: e.color }}
              >
                {e.type}
              </span>
              {e.registrationUrl ? (
                <a
                  href={e.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 h-[38px] px-3 sm:px-4 rounded-md border border-line bg-card text-ink font-semibold text-[13px] flex items-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Inscribirse
                </a>
              ) : (
                <button className="shrink-0 h-[38px] px-3 sm:px-4 rounded-md border border-line bg-card text-ink font-semibold text-[13px] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  Inscribirse
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
