import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Sparkles, ArrowLeft, LogOut } from 'lucide-react'
import Brand from '../components/Brand'
import { appNav } from '../lib/nav'
import { useAuth } from '../lib/auth-context'

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, hasPermission, hasModule, logout } = useAuth()
  useEffect(() => setOpen(false), [pathname])

  // Migaja: título de la página activa.
  const crumb =
    appNav.flatMap((g) => g.items).find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)) && i.to !== '/app')?.label ??
    (pathname === '/app' ? 'Dashboard General' : 'Plataforma interna')

  const visibleGroups = appNav
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => (!item.permission || hasPermission(item.permission)) && (!item.moduleKey || hasModule(item.moduleKey)),
      ),
    }))
    .filter((group) => group.items.length > 0)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* ===== Sidebar (drawer en móvil, fijo en ≥1024px) ===== */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={`fixed lg:static z-40 w-[248px] shrink-0 h-full bg-card border-r border-line flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 shrink-0 flex items-center gap-2.5 px-[18px] border-b border-line">
          <Brand subtitle="PLATAFORMA INTERNA" to="/app" />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <div className="font-mono text-[10px] tracking-[0.12em] text-subtle px-2.5 pt-3 pb-1">
                {group.title}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13.5px] transition-colors mb-0.5 ${
                      isActive ? 'font-bold' : 'font-medium text-body hover:bg-hover'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { color: 'var(--accent)', background: 'var(--accent-50)', border: '1px solid var(--accent-100)' }
                      : { border: '1px solid transparent' }
                  }
                >
                  <item.icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="shrink-0 p-3 border-t border-line flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg border border-line bg-card text-body text-[13px] font-semibold hover:bg-hover transition-colors"
          >
            <ArrowLeft size={16} /> Volver al portal
          </Link>
          <div className="flex items-center gap-2.5 p-2 rounded-[10px]">
            <span
              className="w-[30px] h-[30px] shrink-0 rounded-full text-white flex items-center justify-center font-bold text-xs font-mono"
              style={{ background: 'linear-gradient(135deg,var(--accent),#ff6b6b)' }}
            >
              {user?.initials ?? '—'}
            </span>
            <span className="flex flex-col leading-tight overflow-hidden flex-1">
              <span className="font-semibold text-ink text-[13px] whitespace-nowrap truncate">{user?.fullName ?? 'Invitado'}</span>
              <span className="text-muted text-[11px] whitespace-nowrap truncate">{user?.role.name ?? ''}</span>
            </span>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-line text-muted hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-card/90 backdrop-blur-md border-b border-line z-10">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-md border border-line text-ink"
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[13px]">
            <span className="text-muted">Plataforma interna</span>
            <span className="text-subtle">/</span>
            <span className="text-ink font-semibold">{crumb}</span>
          </div>

          <div className="flex-1 max-w-[420px] mx-auto relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              placeholder="Buscar proyectos, actas, documentos…"
              className="w-full h-[38px] pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-[5px] rounded-full border"
              style={{ color: 'var(--green-600)', background: 'var(--green-50)', borderColor: 'var(--green-100)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-livedot" style={{ background: 'var(--green-500)' }} />
              EN VIVO
            </span>
            <Link
              to="/app/innovaia"
              className="h-[38px] px-4 rounded-md text-white font-semibold text-[13px] inline-flex items-center gap-1.5"
              style={{ background: 'var(--accent)' }}
            >
              <Sparkles size={15} /> InnovaIA
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
