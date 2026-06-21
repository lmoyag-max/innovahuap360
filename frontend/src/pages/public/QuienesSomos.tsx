import { useQuery } from '@tanstack/react-query'
import { FileText, Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { api } from '../../lib/api'
import { integrantes, gobernanza } from '../../data/public'

interface AboutMember {
  id: string
  name: string
  role: string
  unit: string | null
  committeeRole: string | null
  email: string | null
  photoUrl: string | null
}
interface AboutAxis { id: string; name: string; description: string | null; icon: string | null }
interface AboutObjective { id: string; title: string; description: string | null }
interface AboutValue { id: string; name: string; description: string | null }
interface AboutDocument { id: string; name: string; description: string | null; fileUrl: string }

interface AboutResponse {
  published: boolean
  content: {
    title: string
    excerpt: string | null
    body: string | null
    secondaryBody: string | null
    mission: string | null
    vision: string | null
    purpose: string | null
    imageUrl: string | null
  } | null
  members: AboutMember[]
  axes: AboutAxis[]
  objectives: AboutObjective[]
  values: AboutValue[]
  documents: AboutDocument[]
}

const FALLBACK_TITLE = 'El gobierno de la innovación del HUAP'
const FALLBACK_INTRO =
  'El Comité de Innovación articula, prioriza y acompaña las iniciativas que mejoran la atención de urgencia. Creemos que la innovación pertenece a todos los funcionarios y usuarios del hospital.'

export default function QuienesSomos() {
  const { data, isLoading, isError } = useQuery<AboutResponse>({
    queryKey: ['public-quienes-somos'],
    queryFn: async () => (await api.get('/public/quienes-somos')).data,
    retry: 1,
  })

  // Fallback solo si la API no respondió (red/servidor caído) — no se usa
  // cuando la API respondió pero el contenido está despublicado o vacío.
  const useFallback = isError
  const members: { name: string; role: string; ini?: string; photoUrl?: string | null }[] = useFallback
    ? integrantes.map((m) => ({ name: m.name, role: m.role, ini: m.ini }))
    : (data?.members ?? []).map((m) => ({ name: m.name, role: m.role, photoUrl: m.photoUrl }))

  const title = useFallback ? FALLBACK_TITLE : data?.content?.title ?? FALLBACK_TITLE
  const intro = useFallback ? FALLBACK_INTRO : data?.content?.excerpt ?? FALLBACK_INTRO
  const body = useFallback ? null : data?.content?.body
  const secondaryBody = useFallback ? null : data?.content?.secondaryBody
  const mission = useFallback ? null : data?.content?.mission
  const vision = useFallback ? null : data?.content?.vision
  const purpose = useFallback ? null : data?.content?.purpose
  const axes = useFallback ? [] : data?.axes ?? []
  const objectives = useFallback ? [] : data?.objectives ?? []
  const values = useFallback ? [] : data?.values ?? []
  const documents = useFallback ? [] : data?.documents ?? []

  const showDraftNotice = !isLoading && !isError && data && !data.published

  return (
    <div className="max-w-container mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <PageHeader eyebrow="QUIÉNES SOMOS" title={title} intro={intro} />

      {showDraftNotice && (
        <p className="mb-6 text-[13px] text-muted bg-inset border border-line rounded-card px-4 py-3">
          El contenido detallado de esta página está siendo actualizado por el Comité.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { v: '2024', l: 'Año de constitución', d: 'Formalizado por resolución institucional.', c: 'var(--accent)' },
          { v: String(members.length || 12), l: 'Integrantes', d: 'Equipos clínicos, gestión y tecnología.', c: 'var(--blue-500)' },
          { v: String(gobernanza.length), l: 'Etapas de gobernanza', d: 'De la idea al impacto medible.', c: 'var(--green-500)' },
        ].map((s) => (
          <div key={s.l} className="bg-card border border-line rounded-card p-6">
            <div className="font-mono text-3xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-sm text-body mt-1.5 font-semibold">{s.l}</div>
            <div className="text-[13px] text-muted mt-0.5">{s.d}</div>
          </div>
        ))}
      </div>

      {(body || secondaryBody) && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {body && <p className="text-[14.5px] text-body leading-relaxed whitespace-pre-line">{body}</p>}
          {secondaryBody && <p className="text-[14.5px] text-body leading-relaxed whitespace-pre-line">{secondaryBody}</p>}
        </div>
      )}

      {(mission || vision || purpose) && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {mission && (
            <div className="bg-card border border-line rounded-card p-5">
              <div className="text-[12px] font-bold text-subtle uppercase tracking-wide mb-1.5">Misión</div>
              <p className="text-[13.5px] text-body leading-relaxed">{mission}</p>
            </div>
          )}
          {vision && (
            <div className="bg-card border border-line rounded-card p-5">
              <div className="text-[12px] font-bold text-subtle uppercase tracking-wide mb-1.5">Visión</div>
              <p className="text-[13.5px] text-body leading-relaxed">{vision}</p>
            </div>
          )}
          {purpose && (
            <div className="bg-card border border-line rounded-card p-5">
              <div className="text-[12px] font-bold text-subtle uppercase tracking-wide mb-1.5">Propósito</div>
              <p className="text-[13.5px] text-body leading-relaxed">{purpose}</p>
            </div>
          )}
        </div>
      )}

      <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Cómo gobernamos la innovación</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {gobernanza.map((g) => (
          <div key={g.step} className="bg-card border border-line rounded-card p-[22px]">
            <div
              className="font-mono text-[13px] font-bold text-white w-[34px] h-[34px] rounded-[9px] flex items-center justify-center mb-3.5"
              style={{ background: 'var(--accent)' }}
            >
              {g.step}
            </div>
            <div className="text-[15px] font-bold text-ink leading-snug mb-1.5">{g.title}</div>
            <div className="text-[13px] text-muted leading-relaxed">{g.desc}</div>
          </div>
        ))}
      </div>

      {axes.length > 0 && (
        <>
          <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Ejes de trabajo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {axes.map((a) => (
              <div key={a.id} className="bg-card border border-line rounded-card p-[22px]">
                <div className="text-[15px] font-bold text-ink leading-snug mb-1.5">{a.name}</div>
                {a.description && <div className="text-[13px] text-muted leading-relaxed">{a.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Integrantes del Comité</h2>
      {isLoading ? (
        <p className="text-[13px] text-muted">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-3.5 bg-card border border-line rounded-card p-4">
              {m.photoUrl ? (
                <img
                  src={`${api.defaults.baseURL}${m.photoUrl}`}
                  alt={m.name}
                  className="w-12 h-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className="w-12 h-12 shrink-0 rounded-full text-white flex items-center justify-center font-bold text-[15px] font-mono"
                  style={{ background: 'linear-gradient(135deg,var(--accent),#ff6b6b)' }}
                >
                  {m.ini ?? m.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </span>
              )}
              <div>
                <div className="text-[15px] font-bold text-ink leading-tight">{m.name}</div>
                <div className="text-[13px] text-muted mt-0.5">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {objectives.length > 0 && (
        <>
          <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Objetivos del Comité</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {objectives.map((o) => (
              <div key={o.id} className="bg-card border border-line rounded-card p-[22px]">
                <div className="text-[15px] font-bold text-ink leading-snug mb-1.5">{o.title}</div>
                {o.description && <div className="text-[13px] text-muted leading-relaxed">{o.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {values.length > 0 && (
        <>
          <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Valores y principios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {values.map((v) => (
              <div key={v.id} className="bg-card border border-line rounded-card p-[22px]">
                <div className="text-[15px] font-bold text-ink leading-snug mb-1.5">{v.name}</div>
                {v.description && <div className="text-[13px] text-muted leading-relaxed">{v.description}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {documents.length > 0 && (
        <>
          <h2 className="mt-10 mb-4.5 mb-5 text-[22px] text-ink tracking-tight font-bold">Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((d) => (
              <a
                key={d.id}
                href={`${api.defaults.baseURL}${d.fileUrl}`}
                className="flex items-center gap-3 bg-card border border-line rounded-card p-4 hover:border-[var(--accent)] transition-colors"
              >
                <FileText size={20} className="shrink-0 text-muted" />
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-ink leading-tight">{d.name}</div>
                  {d.description && <div className="text-[12.5px] text-muted mt-0.5">{d.description}</div>}
                </div>
                <Download size={16} className="shrink-0 text-subtle" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
