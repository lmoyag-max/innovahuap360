import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { Menu, X, Lock } from 'lucide-react'
import Brand from '../components/Brand'
import { publicNav } from '../lib/nav'

export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Cierra el menú móvil al cambiar de página y al volver a desktop.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const linkBase =
    'px-2.5 py-2 text-[13.5px] rounded-md transition-colors whitespace-nowrap'

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 h-[68px] flex items-center gap-3 sm:gap-6 px-4 sm:px-8 border-b border-line bg-card/90 backdrop-blur-md">
        <Brand />

        {/* Nav desktop (≥1024px) */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {publicNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'font-bold' : 'font-medium text-body hover:bg-hover'}`
              }
              style={({ isActive }) =>
                isActive
                  ? { color: 'var(--accent)', boxShadow: 'inset 0 -2px 0 var(--accent)' }
                  : undefined
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones (≥768px) */}
        <div className="ml-auto hidden md:flex items-center gap-2.5">
          <Link
            to="/postula"
            className="h-10 px-4 rounded-md border border-line bg-card text-ink font-semibold text-[13.5px] flex items-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Postular idea
          </Link>
          <Link
            to="/login"
            className="h-10 px-4 rounded-md text-white font-semibold text-[13.5px] inline-flex items-center gap-1.5 shadow-sm transition-colors"
            style={{ background: 'var(--accent)' }}
          >
            <Lock size={15} /> Acceso Comité
          </Link>
        </div>

        {/* Hamburguesa (<1024px) */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="lg:hidden ml-auto md:ml-2 w-11 h-11 flex items-center justify-center rounded-md border border-line bg-card text-ink"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ===== Drawer móvil ===== */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-[68px] z-20 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed top-[68px] right-0 bottom-0 z-30 w-[82%] max-w-[340px] bg-card border-l border-line p-4 overflow-y-auto lg:hidden animate-viewin">
            <div className="flex flex-col gap-1">
              {publicNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] transition-colors ${
                      isActive ? 'font-bold' : 'font-medium text-body hover:bg-hover'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { color: 'var(--accent)', background: 'var(--accent-50)' } : undefined
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 mt-5 pt-5 border-t border-line">
              <Link
                to="/postula"
                className="h-12 rounded-lg border border-line bg-card text-ink font-semibold text-[15px] flex items-center justify-center"
              >
                Postular idea
              </Link>
              <Link
                to="/login"
                className="h-12 rounded-lg text-white font-semibold text-[15px] flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}
              >
                <Lock size={17} /> Acceso Comité
              </Link>
            </div>
          </nav>
        </>
      )}

      {/* ===== Contenido ===== */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 text-white/70 px-4 sm:px-8 pt-10 pb-7" style={{ background: 'var(--slate-900)' }}>
        <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.png" alt="HUAP" className="w-8 h-8 bg-white rounded-lg p-0.5" />
              <span className="font-extrabold text-white text-[15px]">INNOVAHUAP 360</span>
            </div>
            <p className="text-[13px] leading-relaxed">
              Transformando ideas en impacto para la salud pública. Comité de Innovación, Hospital de
              Urgencia Asistencia Pública.
            </p>
          </div>
          <div className="flex gap-12 flex-wrap">
            <FooterCol title="PLATAFORMA" links={['Portafolio', 'Observatorio', 'Conocimiento', 'Eventos']} />
            <FooterCol title="COMITÉ" links={['Quiénes somos', 'Política de innovación', 'Gobernanza', 'Contacto']} />
          </div>
        </div>
        <div className="max-w-container mx-auto mt-7 pt-4.5 pt-5 border-t border-white/10 font-mono text-[11px] text-white/40">
          © 2026 HUAP · Posta Central · Santiago de Chile
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.12em] text-white/40 mb-2.5">{title}</div>
      <div className="flex flex-col gap-2 text-[13px]">
        {links.map((l) => (
          <span key={l} className="hover:text-white cursor-pointer transition-colors">
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
