import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Sparkles, Lightbulb, LayoutGrid, Play, TrendingUp, Users, ArrowRight,
  ScrollText, HeartHandshake, Newspaper, CalendarClock, Network,
} from 'lucide-react'
import { Eyebrow, ProjectCard, SectionTitle, Dot } from '../../components/ui'
import { kpis, destacados, noticias, actividades, ecosistema } from '../../data/public'

const kpiIcons = [Lightbulb, LayoutGrid, Play, TrendingUp, Users]
const kpiTones = ['var(--accent)', 'var(--blue-500)', 'var(--violet-500)', 'var(--green-500)', 'var(--amber-500)']

export default function Home() {
  return (
    <div className="animate-viewin overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[480px] sm:min-h-[560px] flex items-center px-4 sm:px-8 py-16">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: 'url(/fondo.jpg)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(11,13,17,.95) 0%, rgba(23,17,19,.88) 38%, rgba(169,15,23,.62) 78%, rgba(109,73,214,.45) 100%)',
          }}
        />
        {/* Malla tecnológica decorativa */}
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-soft-light"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,.7) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Orbes de luz ambiental */}
        <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full opacity-30 blur-[80px]" style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }} />
        <div className="absolute left-[-10%] bottom-[-20%] w-[380px] h-[380px] rounded-full opacity-25 blur-[90px]" style={{ background: 'radial-gradient(circle, var(--violet-500), transparent 70%)' }} />

        <div className="relative max-w-container mx-auto w-full">
          <span
            className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] px-3.5 py-1.5 rounded-full border backdrop-blur-md animate-viewin"
            style={{ color: '#ffb3b6', background: 'rgba(237,29,37,.16)', borderColor: 'rgba(237,29,37,.4)' }}
          >
            <Network size={12} /> PORTAL PÚBLICO DE INNOVACIÓN
          </span>
          <h1
            className="mt-5 max-w-[820px] text-[34px] sm:text-[46px] lg:text-[56px] leading-[1.04] tracking-tight font-extrabold text-white animate-viewin"
            style={{ animationDelay: '60ms' }}
          >
            Impulsando la{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(95deg, #ff7a7e, #ffb3b6 45%, #c9b6ff)' }}
            >
              innovación
            </span>{' '}
            que transforma la atención de salud
          </h1>
          <p className="mt-5 max-w-[600px] text-[16px] sm:text-[18px] leading-relaxed text-white/80 animate-viewin" style={{ animationDelay: '120ms' }}>
            Un espacio para conectar ideas, proyectos, personas y resultados que generan valor para
            pacientes, funcionarios y la salud pública.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 animate-viewin" style={{ animationDelay: '180ms' }}>
            <Link
              to="/postula"
              className="group inline-flex items-center justify-center gap-2 h-12 sm:h-[52px] px-6 rounded-xl text-white font-bold text-[15px] sm:text-base shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(120deg,var(--accent),#ff5358)', boxShadow: '0 10px 30px rgba(237,29,37,.45)' }}
            >
              <Sparkles size={18} className="transition-transform duration-300 group-hover:rotate-12" /> Postula una idea
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/portafolio"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-[52px] px-6 rounded-xl text-white font-semibold text-[15px] sm:text-base border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5"
            >
              Conocer el portafolio
            </Link>
          </div>
        </div>
      </section>

      {/* ===== KPI STRIP (glass flotante sobre el hero) ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 -mt-9 sm:-mt-10 relative z-[2]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {kpis.map((k, i) => {
            const Icon = kpiIcons[i]
            return (
              <div
                key={k.label}
                className="group relative overflow-hidden rounded-card p-4 sm:p-[18px] border backdrop-blur-xl transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,.94), rgba(255,255,255,.82))',
                  borderColor: 'rgba(255,255,255,.6)',
                  boxShadow: '0 14px 38px rgba(17,21,27,.16)',
                }}
              >
                <span
                  className="absolute -right-3 -top-3 w-[54px] h-[54px] rounded-full opacity-[0.14]"
                  style={{ background: kpiTones[i] }}
                />
                <IconBadge color={kpiTones[i]} icon={<Icon size={16} />} size={34} />
                <div className="font-mono text-[20px] sm:text-[24px] font-bold text-ink leading-none tracking-tight mt-2.5">
                  {k.value}
                </div>
                <div className="text-[11px] sm:text-[11.5px] text-muted mt-1 font-semibold leading-tight">{k.label}</div>
                {k.trend && (
                  <div className="font-mono text-[10px] mt-1.5 font-semibold" style={{ color: kpiTones[i] }}>
                    {k.trend}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ===== INFO SECTIONS ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 pt-12 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4">
          <div className="group relative overflow-hidden bg-card border border-line rounded-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
            <IconBadge color="var(--accent)" icon={<Users size={17} />} size={42} />
            <Eyebrow className="mt-3.5 block">QUIÉNES SOMOS</Eyebrow>
            <h3 className="text-xl text-ink tracking-tight mt-2 mb-2 font-bold">
              La innovación pertenece a todos
            </h3>
            <p className="text-body text-[14.5px] leading-relaxed mb-4">
              El Comité de Innovación del HUAP articula, prioriza y acompaña iniciativas de
              funcionarios y usuarios que mejoran la atención de urgencia.
            </p>
            <Link to="/quienes-somos" className="inline-flex items-center gap-1 text-[13.5px] font-semibold transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--accent)' }}>
              Conocer el Comité <ArrowRight size={14} />
            </Link>
          </div>
          <div className="group relative overflow-hidden bg-card border border-line rounded-card p-6 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
            <IconBadge color="var(--blue-600)" icon={<ScrollText size={16} />} size={38} />
            <Eyebrow className="mt-3.5 block !text-[var(--blue-600)]">POLÍTICA</Eyebrow>
            <h3 className="text-lg text-ink tracking-tight mt-2 mb-2 font-bold">Marco institucional</h3>
            <p className="text-body text-[13.5px] leading-relaxed mb-3.5">
              Principios, etapas y criterios de evaluación abiertos a la comunidad.
            </p>
            <Link to="/politica" className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--blue-600)' }}>
              Ver documentos <ArrowRight size={13} />
            </Link>
          </div>
          <div
            className="relative overflow-hidden rounded-card p-6 text-white flex flex-col transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(150deg,var(--accent),#ff6b6b 60%,#ff9a7a)', boxShadow: '0 14px 34px rgba(237,29,37,.28)' }}
          >
            <span className="absolute -right-6 -bottom-6 w-[120px] h-[120px] rounded-full opacity-15 bg-white" />
            <IconBadge color="rgba(255,255,255,.22)" iconColor="#fff" icon={<HeartHandshake size={17} />} size={42} />
            <span className="font-mono text-[10px] tracking-[0.12em] text-white/85 mt-3.5">HUMANIZACIÓN</span>
            <h3 className="text-lg tracking-tight mt-2 mb-2 text-white font-bold">Las personas al centro</h3>
            <p className="text-[13.5px] leading-relaxed text-white/90">
              Cada iniciativa se mide también por su impacto humano en pacientes y equipos.
            </p>
          </div>
        </div>
      </section>

      {/* ===== PROYECTOS DESTACADOS ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 py-7">
        <SectionTitle
          title="Proyectos destacados"
          subtitle="Iniciativas en curso con mayor impacto medido."
          action={
            <Link to="/portafolio" className="inline-flex items-center gap-1 text-[13.5px] font-semibold shrink-0 transition-transform hover:translate-x-0.5" style={{ color: 'var(--accent)' }}>
              Ver portafolio <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destacados.map((p) => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      </section>

      {/* ===== NOTICIAS + EVENTOS ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="bg-card border border-line rounded-card p-6 transition-shadow duration-200 hover:shadow-card-hover">
            <SectionTitle
              eyebrow="OBSERVATORIO"
              title="Noticias recientes"
              action={
                <Link to="/observatorio" className="inline-flex items-center gap-1 text-[12.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                  Ver todo <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="flex flex-col">
              {noticias.map((n) => (
                <div key={n.title} className="group flex gap-4 py-3.5 border-b border-line last:border-0 transition-colors rounded-lg -mx-2 px-2 hover:bg-sunken">
                  <div className="w-[52px] shrink-0 text-center rounded-[10px] py-1.5" style={{ background: 'var(--accent-50)' }}>
                    <div className="font-mono text-[20px] font-bold leading-none" style={{ color: 'var(--accent)' }}>
                      {n.day}
                    </div>
                    <div className="font-mono text-[9.5px] text-muted uppercase">{n.mon}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-[14.5px] leading-snug">{n.title}</div>
                    <div className="text-muted text-[12.5px] mt-0.5 inline-flex items-center gap-1">
                      <Newspaper size={11} className="text-subtle" /> {n.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-line rounded-card p-6 transition-shadow duration-200 hover:shadow-card-hover">
            <SectionTitle
              eyebrow="AGENDA"
              title="Próximos eventos"
              action={
                <Link to="/eventos" className="inline-flex items-center gap-1 text-[12.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                  Ver todos <ArrowRight size={13} />
                </Link>
              }
            />
            <div className="flex flex-col gap-3.5">
              {actividades.map((a) => (
                <div key={a.title} className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 shrink-0 rounded-full mt-1.5 ring-4" style={{ background: a.color, '--tw-ring-color': `${a.color}22` } as Record<string, string>} />
                  <div>
                    <div className="font-semibold text-ink text-[13.5px] leading-snug">{a.title}</div>
                    <div className="font-mono text-muted text-[11px] mt-0.5 inline-flex items-center gap-1">
                      <CalendarClock size={11} className="text-subtle" /> {a.when}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4.5 mt-5 pt-4 border-t border-line">
              <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-2.5 inline-flex items-center gap-1.5">
                <Network size={11} /> ECOSISTEMA DE INNOVACIÓN
              </div>
              <div className="flex flex-wrap gap-2">
                {ecosistema.map((e) => (
                  <span key={e} className="inline-flex items-center gap-1.5 text-[11.5px] text-body bg-sunken border border-line px-2.5 py-1.5 rounded-full transition-colors hover:border-[var(--accent-100)] hover:bg-[var(--accent-50)]">
                    <Dot color="var(--accent)" size={5} /> {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 pt-2 pb-12">
        <div
          className="relative overflow-hidden rounded-hero p-7 sm:p-11 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{ background: 'linear-gradient(125deg,var(--slate-900),var(--accent-700) 70%,var(--violet-600))' }}
        >
          <span className="absolute -left-10 -top-16 w-[260px] h-[260px] rounded-full opacity-20 blur-[60px]" style={{ background: 'var(--accent)' }} />
          <span className="absolute right-[-6%] bottom-[-30%] w-[220px] h-[220px] rounded-full opacity-15 blur-[60px]" style={{ background: '#fff' }} />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-white/70 mb-2.5">
              <Sparkles size={12} /> BANCO DE IDEAS
            </span>
            <h2 className="text-2xl sm:text-[27px] text-white tracking-tight max-w-[560px] font-bold">
              Todas las ideas pueden transformarse en innovación
            </h2>
            <p className="mt-2 text-white/75 text-[15px]">¿Tienes una idea para mejorar la atención? Cuéntanos.</p>
          </div>
          <Link
            to="/postula"
            className="relative inline-flex items-center gap-2 h-12 sm:h-[52px] px-6 rounded-xl font-bold text-[15px] sm:text-base shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            style={{ background: '#fff', color: 'var(--accent)' }}
          >
            <Sparkles size={18} /> Postular ahora
          </Link>
        </div>
      </section>
    </div>
  )
}

function IconBadge({
  icon, color, size = 38, iconColor = '#fff',
}: { icon: ReactNode; color: string; size?: number; iconColor?: string }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-[12px] shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${color}, ${color})`,
        color: iconColor,
        boxShadow: `0 6px 16px -4px ${color}, inset 0 1px 0 rgba(255,255,255,.35)`,
      }}
    >
      {icon}
    </span>
  )
}
