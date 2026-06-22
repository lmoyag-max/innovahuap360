import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import RequireAuth from './components/RequireAuth'
import RequirePermission from './components/RequirePermission'
import RequireModule from './components/RequireModule'

// Páginas públicas
import Home from './pages/public/Home'
import QuienesSomos from './pages/public/QuienesSomos'
import Politica from './pages/public/Politica'
import ProyectosPublico from './pages/public/ProyectosPublico'
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
import Proyectos from './pages/app/Proyectos'
import ProyectoDetalle from './pages/app/ProyectoDetalle'
import Actas from './pages/app/Actas'
import Factibilidad from './pages/app/Factibilidad'
import FichaDetalle from './pages/app/factibilidad/FichaDetalle'
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
import Correo from './pages/admin/Correo'

export default function App() {
  return (
    <Routes>
      {/* Portal público */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="quienes-somos" element={<QuienesSomos />} />
        <Route path="politica" element={<Politica />} />
        <Route path="proyectos" element={<ProyectosPublico />} />
        <Route path="portafolio" element={<Navigate to="/proyectos" replace />} />
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
          <Route element={<RequireModule moduleKey="dashboard" />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route element={<RequireModule moduleKey="ideas" />}>
            <Route element={<RequirePermission permission="ideas.read" />}>
              <Route path="ideas" element={<BancoIdeas />} />
            </Route>
          </Route>
          <Route element={<RequireModule moduleKey="projects" />}>
            <Route path="proyectos" element={<Proyectos />} />
            <Route path="proyectos/:id" element={<ProyectoDetalle />} />
          </Route>
          <Route path="portafolio" element={<Navigate to="/app/proyectos" replace />} />
          <Route element={<RequireModule moduleKey="minutes" />}>
            <Route path="actas" element={<Actas />} />
          </Route>
          <Route element={<RequireModule moduleKey="factibilidad" />}>
            <Route path="factibilidad" element={<Factibilidad />} />
            <Route path="factibilidad/:fichaId" element={<FichaDetalle />} />
          </Route>
          <Route element={<RequireModule moduleKey="gantt" />}>
            <Route path="gantt" element={<Gantt />} />
          </Route>
          <Route element={<RequireModule moduleKey="knowledge" />}>
            <Route path="conocimiento" element={<ConocimientoInterno />} />
          </Route>
          <Route element={<RequireModule moduleKey="communications" />}>
            <Route path="comunicaciones" element={<Comunicaciones />} />
          </Route>
          <Route element={<RequireModule moduleKey="innovaia" />}>
            <Route path="innovaia" element={<InnovaIA />} />
          </Route>
          <Route element={<RequireModule moduleKey="executive" />}>
            <Route path="ejecutivo" element={<Ejecutivo />} />
          </Route>

          {/* Administración */}
          <Route path="admin">
            <Route index element={<AdminHome />} />
            <Route element={<RequireModule moduleKey="public_content" />}>
              <Route element={<RequirePermission permission="public_content.manage" />}>
                <Route path="contenido-publico" element={<ContenidoPublico />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="users" />}>
              <Route element={<RequirePermission permission="users.manage" />}>
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="units" />}>
              <Route element={<RequirePermission permission="units.manage" />}>
                <Route path="unidades" element={<UnidadesServicios />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="roles" />}>
              <Route element={<RequirePermission permission="roles.manage" />}>
                <Route path="roles" element={<Roles />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="settings" />}>
              <Route element={<RequirePermission permission="settings.manage" />}>
                <Route path="configuracion" element={<Configuracion />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="mail" />}>
              <Route element={<RequirePermission permission="settings.manage" />}>
                <Route path="correo" element={<Correo />} />
              </Route>
            </Route>
            <Route element={<RequireModule moduleKey="audit" />}>
              <Route element={<RequirePermission permission="audit.read" />}>
                <Route path="auditoria" element={<Auditoria />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
