import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'

export default function RequirePermission({ permission }: { permission: string }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) return <Navigate to="/app" replace />
  return <Outlet />
}
