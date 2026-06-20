import { Link } from 'react-router-dom'
import { ShieldCheck, UserCog, KeyRound, Settings, ScrollText } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { useAuth } from '../../lib/auth-context'

const CARDS = [
  { to: '/app/admin/contenido-publico', icon: ShieldCheck, title: 'Contenido público', desc: 'Home, política, portafolio, observatorio, conocimiento, eventos, noticias y banners.', permission: 'content.manage' },
  { to: '/app/admin/usuarios', icon: UserCog, title: 'Usuarios', desc: 'Crear cuentas, activar/desactivar y restablecer contraseñas.', permission: 'users.manage' },
  { to: '/app/admin/roles', icon: KeyRound, title: 'Roles y permisos', desc: 'Definir qué puede hacer cada rol del Comité.', permission: 'roles.manage' },
  { to: '/app/admin/configuracion', icon: Settings, title: 'Configuración', desc: 'Parámetros institucionales (KPIs ejecutivos, etc.).', permission: 'settings.manage' },
  { to: '/app/admin/auditoria', icon: ScrollText, title: 'Auditoría', desc: 'Bitácora de acciones sensibles del sistema.', permission: 'audit.read' },
]

export default function AdminHome() {
  const { hasPermission } = useAuth()
  const cards = CARDS.filter((c) => hasPermission(c.permission))

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-5 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">
        Panel de administración
      </h1>

      {cards.length === 0 && <p className="text-[13px] text-muted">No tienes permisos de administración asignados.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-card border border-line rounded-card p-5 hover:border-[var(--accent)] hover:shadow-card-hover transition-all"
          >
            <c.icon size={22} style={{ color: 'var(--accent)' }} />
            <div className="mt-3 text-[15px] font-bold text-ink">{c.title}</div>
            <div className="mt-1 text-[12.5px] text-muted leading-relaxed">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
