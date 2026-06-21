import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  Rocket, FlaskConical, ShieldAlert, ClipboardCheck, Layers, History, Lightbulb,
  Inbox, ScanSearch, CheckCircle2, XCircle, Building2, Tag, ArrowUpRight,
} from 'lucide-react'
import { ProgressBar } from '../../components/ui'
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
      {/* ===== Encabezado ===== */}
      <div className="relative overflow-hidden rounded-card mb-5 px-5 sm:px-7 py-6 sm:py-7" style={{ background: 'linear-gradient(125deg,var(--slate-900),var(--slate-800) 60%,var(--accent-700))' }}>
        <span className="absolute -right-10 -top-14 w-[220px] h-[220px] rounded-full opacity-25 blur-[60px]" style={{ background: 'var(--accent)' }} />
        <span className="absolute left-[18%] -bottom-20 w-[180px] h-[180px] rounded-full opacity-15 blur-[55px]" style={{ background: 'var(--violet-500)' }} />
        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.7) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div className="relative flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] px-3 py-1 rounded-full border" style={{ color: '#ffb3b6', background: 'rgba(237,29,37,.18)', borderColor: 'rgba(237,29,37,.36)' }}>
              <Rocket size={11} /> MISSION CONTROL
            </span>
            <h1 className="mt-2.5 text-[22px] sm:text-[27px] text-white tracking-tight font-extrabold">
              Centro de operaciones del Comité
            </h1>
            <p className="mt-1.5 text-[13px] text-white/65 max-w-[520px]">
              Visión consolidada de proyectos, riesgos, acuerdos y el embudo de ideas en un solo lugar.
            </p>
          </div>
          {isLoading && <div className="font-mono text-xs text-white/60">Cargando…</div>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        <KpiTile icon={<Rocket size={17} />} value={data?.kpis.activeProjects ?? '—'} label="Proyectos activos" color="var(--blue-500)" bg="var(--blue-50)" />
        <KpiTile icon={<FlaskConical size={17} />} value={data?.kpis.pilotsInProgress ?? '—'} label="Pilotos en curso" color="var(--violet-500)" bg="var(--violet-50)" />
        <KpiTile icon={<ShieldAlert size={17} />} value={data?.kpis.criticalRisks ?? '—'} label="Riesgos críticos" color="var(--accent)" bg="var(--accent-50)" />
        <KpiTile icon={<ClipboardCheck size={17} />} value={`${data?.kpis.agreementsCompletionRate ?? 0}%`} label="Acuerdos cumplidos" color="var(--green-500)" bg="var(--green-50)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">
        {/* Proyectos por etapa */}
        <div className="bg-card border border-line rounded-card p-[22px] transition-shadow duration-200 hover:shadow-card-hover">
          <h3 className="text-base text-ink mb-4.5 mb-5 font-bold flex items-center gap-2">
            <IconBadge color="var(--blue-500)" icon={<Layers size={14} />} /> Proyectos por etapa
          </h3>
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
        <div className="bg-card border border-line rounded-card p-[22px] transition-shadow duration-200 hover:shadow-card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base text-ink font-bold flex items-center gap-2">
              <IconBadge color="var(--accent)" icon={<ShieldAlert size={14} />} /> Riesgos críticos
            </h3>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-50)' }}>
              {data?.topRisks.length ?? 0} activos
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {data?.topRisks.length === 0 && <p className="text-[12.5px] text-muted">Sin riesgos altos registrados.</p>}
            {data?.topRisks.map((r) => (
              <div key={r.id} className="p-3 rounded-[10px] border border-line transition-transform duration-150 hover:-translate-y-0.5" style={{ background: RISK_META[r.riskLevel].bg }}>
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
        <div className="bg-card border border-line rounded-card p-[22px] transition-shadow duration-200 hover:shadow-card-hover">
          <h3 className="text-base text-ink mb-3.5 font-bold flex items-center gap-2">
            <IconBadge color="var(--green-500)" icon={<ClipboardCheck size={14} />} /> Acuerdos pendientes
          </h3>
          <div className="flex flex-col gap-2.5">
            {data?.upcomingAgreements.length === 0 && <p className="text-[12.5px] text-muted">No hay acuerdos pendientes.</p>}
            {data?.upcomingAgreements.map((a) => (
              <div key={a.id} className="flex gap-2.5 items-start">
                <span
                  className="w-2.5 h-2.5 shrink-0 rounded-full mt-1 ring-4"
                  style={{ background: a.state === 'EN_CURSO' ? 'var(--amber-500)' : 'var(--accent)', '--tw-ring-color': a.state === 'EN_CURSO' ? 'var(--amber-50)' : 'var(--accent-50)' } as Record<string, string>}
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
        <div className="bg-card border border-line rounded-card p-[22px] transition-shadow duration-200 hover:shadow-card-hover">
          <h3 className="text-base text-ink mb-3.5 font-bold flex items-center gap-2">
            <IconBadge color="var(--violet-500)" icon={<History size={14} />} /> Actividad reciente
          </h3>
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
        <div className="mt-4 bg-card border border-line rounded-card p-[22px] transition-shadow duration-200 hover:shadow-card-hover">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base text-ink font-bold flex items-center gap-2">
              <IconBadge color="var(--accent)" icon={<Lightbulb size={14} />} /> Banco de Ideas
            </h3>
            <a href="/app/ideas" className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
              Abrir módulo <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4.5 mb-5">
            {[
              { v: data.ideas.total, l: 'Total ideas', icon: <Lightbulb size={14} />, color: 'var(--accent)' },
              { v: data.ideas.received, l: 'Recibidas', icon: <Inbox size={14} />, color: 'var(--blue-500)' },
              { v: data.ideas.inReview, l: 'En revisión', icon: <ScanSearch size={14} />, color: 'var(--amber-500)' },
              { v: data.ideas.approved, l: 'Aprobadas', icon: <CheckCircle2 size={14} />, color: 'var(--green-500)' },
              { v: data.ideas.rejected, l: 'Rechazadas', icon: <XCircle size={14} />, color: 'var(--accent-700)' },
            ].map((k) => (
              <div key={k.l} className="relative overflow-hidden rounded-[10px] p-3 text-center transition-transform duration-150 hover:-translate-y-0.5" style={{ background: 'var(--surface-inset)' }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full mb-1.5" style={{ background: `${k.color}1a`, color: k.color }}>
                  {k.icon}
                </span>
                <div className="font-mono text-[20px] font-bold text-ink leading-none">{k.v}</div>
                <div className="text-[11px] text-muted mt-1 font-semibold">{k.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[12.5px] font-bold text-subtle mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 size={12} /> Por servicio
              </h4>
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
              <h4 className="text-[12.5px] font-bold text-subtle mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Tag size={12} /> Por tipo de proyecto
              </h4>
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

function KpiTile({ icon, value, label, color, bg }: { icon: ReactNode; value: number | string; label: string; color: string; bg: string }) {
  return (
    <div
      className="group relative overflow-hidden rounded-card border border-line p-[18px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ background: `linear-gradient(160deg, ${bg}, var(--surface-card) 70%)` }}
    >
      <span className="absolute -right-3 -top-3 w-[58px] h-[58px] rounded-full opacity-[0.12]" style={{ background: color }} />
      <span
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-110"
        style={{ background: color, color: '#fff', boxShadow: `0 6px 16px -4px ${color}` }}
      >
        {icon}
      </span>
      <div className="font-mono text-[26px] sm:text-[30px] font-bold tracking-tight text-ink leading-none">{value}</div>
      <div className="text-[13px] text-body mt-2 font-semibold">{label}</div>
    </div>
  )
}

function IconBadge({ icon, color }: { icon: ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] shrink-0"
      style={{ background: color, color: '#fff', boxShadow: `0 4px 10px -2px ${color}` }}
    >
      {icon}
    </span>
  )
}
