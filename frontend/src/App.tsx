import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import RequireAuth from './components/RequireAuth'
import RequirePermission from './components/RequirePermission'

// Páginas públicas
import Home from './pages/public/Home'
import QuienesSomos from './pages/public/QuienesSomos'
import Politica from './pages/public/Politica'
import PortafolioPublico from './pages/public/PortafolioPublico'
import Observatorio from './pages/public/Observatorio'
import Conocimiento from './pages/public/Conocimiento'
import Eventos from './pages/public/Eventos'
import Postula from './pages/public/Postula'

// Autenticación
import Login from './pages/auth/Login'
import RecuperarPassword from './pages/auth/RecuperarPassword'
import RestablecerPassword from './pages/auth/RestablecerPassword'

// Páginas privadas (plataforma interna)
import Dashboard from './pages/app/Dashboard'
import BancoIdeas from './pages/app/BancoIdeas'
import Portafolio from './pages/app/Portafolio'
import Actas from './pages/app/Actas'
import Factibilidad from './pages/app/Factibilidad'
import Gantt from './pages/app/Gantt'
import ConocimientoInterno from './pages/app/ConocimientoInterno'
import Comunicaciones from './pages/app/Comunicaciones'
import InnovaIA from './pages/app/InnovaIA'
import Ejecutivo from './pages/app/Ejecutivo'

// Administración
import AdminHome from './pages/admin/AdminHome'
import ContenidoPublico from './pages/admin/ContenidoPublico'
import Usuarios from './pages/admin/Usuarios'
import Roles from './pages/admin/Roles'
import Configuracion from './pages/admin/Configuracion'
import Auditoria from './pages/admin/Auditoria'
import UnidadesServicios from './pages/admin/UnidadesServicios'

export default function App() {
  return (
    <Routes>
      {/* Portal público */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="quienes-somos" element={<QuienesSomos />} />
        <Route path="politica" element={<Politica />} />
        <Route path="portafolio" element={<PortafolioPublico />} />
        <Route path="observatorio" element={<Observatorio />} />
        <Route path="conocimiento" element={<Conocimiento />} />
        <Route path="eventos" element={<Eventos />} />
        <Route path="postula" element={<Postula />} />
      </Route>

      {/* Autenticación */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="recuperar-password" element={<RecuperarPassword />} />
        <Route path="restablecer-password/:token" element={<RestablecerPassword />} />
      </Route>

      {/* Plataforma interna del Comité (requiere sesión) */}
      <Route element={<RequireAuth />}>
        <Route path="app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route element={<RequirePermission permission="ideas.read" />}>
            <Route path="ideas" element={<BancoIdeas />} />
          </Route>
          <Route path="portafolio" element={<Portafolio />} />
          <Route path="actas" element={<Actas />} />
          <Route path="factibilidad" element={<Factibilidad />} />
          <Route path="gantt" element={<Gantt />} />
          <Route path="conocimiento" element={<ConocimientoInterno />} />
          <Route path="comunicaciones" element={<Comunicaciones />} />
          <Route path="innovaia" element={<InnovaIA />} />
          <Route path="ejecutivo" element={<Ejecutivo />} />

          {/* Administración */}
          <Route path="admin">
            <Route index element={<AdminHome />} />
            <Route element={<RequirePermission permission="content.manage" />}>
              <Route path="contenido-publico" element={<ContenidoPublico />} />
            </Route>
            <Route element={<RequirePermission permission="users.manage" />}>
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
            <Route element={<RequirePermission permission="units.manage" />}>
              <Route path="unidades" element={<UnidadesServicios />} />
            </Route>
            <Route element={<RequirePermission permission="roles.manage" />}>
              <Route path="roles" element={<Roles />} />
            </Route>
            <Route element={<RequirePermission permission="settings.manage" />}>
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
            <Route element={<RequirePermission permission="audit.read" />}>
              <Route path="auditoria" element={<Auditoria />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
