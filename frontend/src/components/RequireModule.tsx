import { Outlet, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { EmptyState } from './ui/EmptyState'
import { useAuth } from '../lib/auth-context'

/**
 * Capa adicional a RequirePermission: bloquea el módulo de navegación si el
 * rol del usuario no lo tiene habilitado (Roles → Acceso a Módulos). A
 * diferencia de RequirePermission (redirección silenciosa), muestra un
 * mensaje explícito de acceso denegado al intentar entrar por URL directa.
 */
export default function RequireModule({ moduleKey }: { moduleKey: string }) {
  const { hasModule } = useAuth()

  if (!hasModule(moduleKey)) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="Acceso denegado"
          description="Este módulo no está habilitado para tu rol. Si crees que deberías tener acceso, contacta a un administrador."
          action={
            <Link
              to="/app"
              className="h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5"
              style={{ background: 'var(--accent)' }}
            >
              <ArrowLeft size={14} /> Volver al Dashboard
            </Link>
          }
        />
      </div>
    )
  }

  return <Outlet />
}
