import { Link } from 'react-router-dom'
import { Sparkles, Lightbulb, LayoutGrid, Play, TrendingUp, Users } from 'lucide-react'
import { Eyebrow, Kpi, ProjectCard, SectionTitle } from '../../components/ui'
import { kpis, destacados, noticias, actividades, ecosistema } from '../../data/public'

const kpiIcons = [Lightbulb, LayoutGrid, Play, TrendingUp, Users]

export default function Home() {
  return (
    <div className="animate-viewin">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden min-h-[440px] sm:min-h-[520px] flex items-center px-4 sm:px-8 py-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/fondo.jpg)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(17,21,27,.92) 0%, rgba(26,20,22,.82) 42%, rgba(169,15,23,.55) 100%)',
          }}
        />
        <div className="relative max-w-container mx-auto w-full">
          <span
            className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] px-3 py-1.5 rounded-full border"
            style={{ color: '#ffb3b6', background: 'rgba(237,29,37,.18)', borderColor: 'rgba(237,29,37,.36)' }}
          >
            PORTAL PÚBLICO DE INNOVACIÓN
          </span>
          <h1 className="mt-5 max-w-[780px] text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.06] tracking-tight font-extrabold text-white">
            Impulsando la innovación que transforma la atención de salud
          </h1>
          <p className="mt-5 max-w-[600px] text-[16px] sm:text-[18px] leading-relaxed text-white/80">
            Un espacio para conectar ideas, proyectos, personas y resultados que generan valor para
            pacientes, funcionarios y la salud pública.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Link
              to="/postula"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-[50px] px-6 rounded-xl text-white font-bold text-[15px] sm:text-base shadow-lg transition-colors"
              style={{ background: 'var(--accent)', boxShadow: '0 8px 26px rgba(237,29,37,.42)' }}
            >
              <Sparkles size={18} /> Postula una idea
            </Link>
            <Link
              to="/portafolio"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-[50px] px-6 rounded-xl text-white font-semibold text-[15px] sm:text-base border border-white/25 bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
            >
              Conocer el portafolio
            </Link>
          </div>
        </div>
      </section>

      {/* ===== KPI STRIP ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 -mt-8 relative z-[2]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpis.map((k, i) => {
            const Icon = kpiIcons[i]
            return <Kpi key={k.label} value={k.value} label={k.label} trend={k.trend} icon={<Icon size={18} />} />
          })}
        </div>
      </section>

      {/* ===== INFO SECTIONS ===== */}
      <section className="max-w-container mx-auto px-4 sm:px-8 pt-11 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4">
          <div className="bg-card border border-line rounded-card p-6">
            <Eyebrow>QUIÉNES SOMOS</Eyebrow>
            <h3 className="text-xl text-ink tracking-tight mt-2.5 mb-2 font-bold">
              La innovación pertenece a todos
            </h3>
            <p className="text-body text-[14.5px] leading-relaxed mb-4">
              El Comité de Innovación del HUAP articula, prioriza y acompaña iniciativas de
              funcionarios y usuarios que mejoran la atención de urgencia.
            </p>
            <Link to="/quienes-somos" className="text-[13.5px] font-semibold" style={{ color: 'var(--accent)' }}>
              Conocer el Comité →
            </Link>
          </div>
          <div className="bg-card border border-line rounded-card p-6 flex flex-col">
            <Eyebrow className="!text-[var(--blue-600)]">POLÍTICA</Eyebrow>
            <h3 className="text-lg text-ink tracking-tight mt-2.5 mb-2 font-bold">Marco institucional</h3>
            <p className="text-body text-[13.5px] leading-relaxed mb-3.5">
              Principios, etapas y criterios de evaluación abiertos a la comunidad.
            </p>
            <Link to="/politica" className="mt-auto text-[13px] font-semibold" style={{ color: 'var(--blue-600)' }}>
              Ver documentos →
            </Link>
          </div>
          <div
            className="rounded-card p-6 text-white flex flex-col"
            style={{ background: 'linear-gradient(140deg,var(--accent),#ff6b6b)' }}
          >
            <span className="font-mono text-[10px] tracking-[0.12em] text-white/85">HUMANIZACIÓN</span>
            <h3 className="text-lg tracking-tight mt-2.5 mb-2 text-white font-bold">Las personas al centro</h3>
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
          action={
            <Link to="/portafolio" className="text-[13.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
              Ver portafolio →
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
          <div className="bg-card border border-line rounded-card p-6">
            <SectionTitle
              title="Noticias recientes"
              action={
                <Link to="/observatorio" className="text-[12.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                  Observatorio →
                </Link>
              }
            />
            <div className="flex flex-col">
              {noticias.map((n) => (
                <div key={n.title} className="flex gap-4 py-3.5 border-b border-line last:border-0">
                  <div className="w-[50px] shrink-0 text-center">
                    <div className="font-mono text-[22px] font-bold leading-none" style={{ color: 'var(--accent)' }}>
                      {n.day}
                    </div>
                    <div className="font-mono text-[10px] text-muted uppercase">{n.mon}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-[14.5px] leading-snug">{n.title}</div>
                    <div className="text-muted text-[12.5px] mt-0.5">{n.tag}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-line rounded-card p-6">
            <SectionTitle
              title="Próximos eventos"
              action={
                <Link to="/eventos" className="text-[12.5px] font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                  Ver todos →
                </Link>
              }
            />
            <div className="flex flex-col gap-3.5">
              {actividades.map((a) => (
                <div key={a.title} className="flex gap-3 items-start">
                  <span className="w-2.5 h-2.5 shrink-0 rounded-full mt-1.5" style={{ background: a.color }} />
                  <div>
                    <div className="font-semibold text-ink text-[13.5px] leading-snug">{a.title}</div>
                    <div className="font-mono text-muted text-[11px] mt-0.5">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4.5 mt-5 pt-4 border-t border-line">
              <div className="font-mono text-[10px] tracking-[0.12em] text-subtle mb-2.5">
                ECOSISTEMA DE INNOVACIÓN
              </div>
              <div className="flex flex-wrap gap-2">
                {ecosistema.map((e) => (
                  <span key={e} className="text-[11.5px] text-body bg-sunken border border-line px-2.5 py-1.5 rounded-full">
                    {e}
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
          style={{ background: 'linear-gradient(120deg,var(--slate-900),var(--accent-700))' }}
        >
          <div>
            <h2 className="text-2xl sm:text-[26px] text-white tracking-tight max-w-[560px]">
              Todas las ideas pueden transformarse en innovación
            </h2>
            <p className="mt-2 text-white/75 text-[15px]">¿Tienes una idea para mejorar la atención? Cuéntanos.</p>
          </div>
          <Link
            to="/postula"
            className="inline-flex items-center gap-2 h-12 sm:h-[50px] px-6 rounded-xl font-bold text-[15px] sm:text-base shrink-0 transition-transform hover:-translate-y-0.5"
            style={{ background: '#fff', color: 'var(--accent)' }}
          >
            <Sparkles size={18} /> Postular ahora
          </Link>
        </div>
      </section>
    </div>
  )
}
