import { useQuery } from '@tanstack/react-query'
import { Eyebrow, ProgressBar } from '../../components/ui'
import { api } from '../../lib/api'
import { STAGES, STAGE_ORDER, RISK_META, describeAction, timeAgo, type ProjectStage } from '../../lib/stages'

interface Overview {
  kpis: { activeProjects: number; pilotsInProgress: number; criticalRisks: number; agreementsCompletionRate: number }
  stageDistribution: { stage: ProjectStage; count: number }[]
  topRisks: { id: string; name: string; riskLevel: 'BAJO' | 'MEDIO' | 'ALTO'; sponsor: string | null }[]
  upcomingAgreements: {
    id: string
    description: string
    responsible: string
    dueDate: string | null
    state: string
    minute: { title: string }
  }[]
  recentActivity: { id: string; action: string; createdAt: string; user: { fullName: string; initials: string } | null }[]
  ideas: {
    total: number
    received: number
    inReview: number
    approved: number
    rejected: number
    byUnit: { unit: string; count: number }[]
    byType: { projectType: string; count: number }[]
  }
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  GESTION_CLINICA: 'Gestión Clínica',
  GESTION_ADMINISTRATIVA: 'Gestión Administrativa',
  ACADEMICO_IDI: 'Académico I+D+i',
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => (await api.get('/dashboard/overview')).data,
  })

  const maxStageCount = Math.max(1, ...(data?.stageDistribution.map((s) => s.count) ?? [1]))
  const stageRows = STAGE_ORDER.filter((s) => s !== 'CIERRE').map((stage) => {
    const count = data?.stageDistribution.find((s) => s.stage === stage)?.count ?? 0
    return { stage, count, pct: Math.round((count / maxStageCount) * 100) }
  })

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <div className="flex items-end justify-between mb-4.5 mb-5 flex-wrap gap-3">
        <div>
          <Eyebrow>MISSION CONTROL</Eyebrow>
          <h1 className="mt-1.5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">
            Centro de operaciones del Comité
          </h1>
        </div>
        {isLoading && <div className="font-mono text-xs text-muted">Cargando…</div>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {[
          { value: data?.kpis.activeProjects ?? '—', label: 'Proyectos activos', tone: 'var(--blue-500)' },
          { value: data?.kpis.pilotsInProgress ?? '—', label: 'Pilotos en curso', tone: 'var(--violet-500)' },
          { value: data?.kpis.criticalRisks ?? '—', label: 'Riesgos críticos', tone: 'var(--accent)' },
          { value: `${data?.kpis.agreementsCompletionRate ?? 0}%`, label: 'Acuerdos cumplidos', tone: 'var(--green-500)' },
        ].map((k) => (
          <div key={k.label} className="relative overflow-hidden bg-card border border-line rounded-card p-[18px]">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: k.tone }} />
            <div className="font-mono text-[26px] sm:text-[30px] font-bold tracking-tight text-ink leading-none">{k.value}</div>
            <div className="text-[13px] text-body mt-2 font-semibold">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">
        {/* Proyectos por etapa */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-4.5 mb-5 font-bold">Proyectos por etapa</h3>
          <div className="flex flex-col gap-3.5">
            {stageRows.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-[110px] sm:w-[120px] shrink-0 text-[12.5px] text-body">{STAGES[s.stage].label}</span>
                <div className="flex-1">
                  <ProgressBar pct={s.pct} color={STAGES[s.stage].color} height={10} />
                </div>
                <span className="w-7 shrink-0 text-right font-mono text-[13px] font-semibold text-ink">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Riesgos críticos */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base text-ink font-bold">Riesgos críticos</h3>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}>
              {data?.topRisks.length ?? 0} activos
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {data?.topRisks.length === 0 && <p className="text-[12.5px] text-muted">Sin riesgos altos registrados.</p>}
            {data?.topRisks.map((r) => (
              <div key={r.id} className="p-3 rounded-[10px] border border-line" style={{ background: RISK_META[r.riskLevel].bg }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink leading-snug">{r.name}</span>
                  <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color: RISK_META[r.riskLevel].color }}>
                    {r.riskLevel}
                  </span>
                </div>
                {r.sponsor && <div className="text-xs text-muted mt-1">{r.sponsor}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Acuerdos pendientes */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Acuerdos pendientes</h3>
          <div className="flex flex-col gap-2.5">
            {data?.upcomingAgreements.length === 0 && <p className="text-[12.5px] text-muted">No hay acuerdos pendientes.</p>}
            {data?.upcomingAgreements.map((a) => (
              <div key={a.id} className="flex gap-2.5 items-start">
                <span
                  className="w-2.5 h-2.5 shrink-0 rounded-full mt-1"
                  style={{ background: a.state === 'EN_CURSO' ? 'var(--amber-500)' : 'var(--accent)' }}
                />
                <div className="flex-1">
                  <div className="text-[13px] text-ink leading-snug">{a.description}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {a.responsible} · {a.minute.title} · {a.state}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-3.5 font-bold">Actividad reciente</h3>
          <div className="flex flex-col gap-3.5">
            {data?.recentActivity.length === 0 && <p className="text-[12.5px] text-muted">Sin actividad registrada todavía.</p>}
            {data?.recentActivity.map((x) => (
              <div key={x.id} className="flex gap-2.5 items-start">
                <span className="w-[26px] h-[26px] shrink-0 rounded-full bg-sunken text-muted flex items-center justify-center text-[10px] font-bold font-mono">
                  {x.user?.initials ?? '—'}
                </span>
                <div className="text-[12.5px] text-body leading-snug">
                  <span className="font-semibold text-ink">{x.user?.fullName ?? 'Sistema'}</span> {describeAction(x.action)}{' '}
                  <span className="text-muted">· {timeAgo(x.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banco de Ideas */}
      {data?.ideas && (
        <div className="mt-4 bg-card border border-line rounded-card p-[22px]">
          <h3 className="text-base text-ink mb-4 font-bold">Banco de Ideas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4.5 mb-5">
            {[
              { v: data.ideas.total, l: 'Total ideas' },
              { v: data.ideas.received, l: 'Recibidas' },
              { v: data.ideas.inReview, l: 'En revisión' },
              { v: data.ideas.approved, l: 'Aprobadas' },
              { v: data.ideas.rejected, l: 'Rechazadas' },
            ].map((k) => (
              <div key={k.l} className="bg-inset rounded-[10px] p-3 text-center">
                <div className="font-mono text-[20px] font-bold text-ink leading-none">{k.v}</div>
                <div className="text-[11px] text-muted mt-1 font-semibold">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[12.5px] font-bold text-subtle mb-2 uppercase tracking-wide">Por servicio</h4>
              <div className="flex flex-col gap-1.5">
                {data.ideas.byUnit.length === 0 && <p className="text-[12px] text-muted">Sin datos.</p>}
                {data.ideas.byUnit.map((u) => (
                  <div key={u.unit} className="flex items-center justify-between text-[12.5px] text-body">
                    <span className="truncate">{u.unit}</span>
                    <span className="font-mono font-semibold text-ink">{u.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[12.5px] font-bold text-subtle mb-2 uppercase tracking-wide">Por tipo de proyecto</h4>
              <div className="flex flex-col gap-1.5">
                {data.ideas.byType.map((t) => (
                  <div key={t.projectType} className="flex items-center justify-between text-[12.5px] text-body">
                    <span>{PROJECT_TYPE_LABEL[t.projectType] ?? t.projectType}</span>
                    <span className="font-mono font-semibold text-ink">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
