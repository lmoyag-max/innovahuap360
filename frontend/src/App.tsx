import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'

// Páginas públicas
import Home from './pages/public/Home'
import QuienesSomos from './pages/public/QuienesSomos'
import Politica from './pages/public/Politica'
import PortafolioPublico from './pages/public/PortafolioPublico'
import Observatorio from './pages/public/Observatorio'
import Conocimiento from './pages/public/Conocimiento'
import Eventos from './pages/public/Eventos'
import Postula from './pages/public/Postula'

// Páginas privadas (plataforma interna)
import Dashboard from './pages/app/Dashboard'
import Portafolio from './pages/app/Portafolio'
import Actas from './pages/app/Actas'
import Factibilidad from './pages/app/Factibilidad'
import Gantt from './pages/app/Gantt'
import ConocimientoInterno from './pages/app/ConocimientoInterno'
import Comunicaciones from './pages/app/Comunicaciones'
import InnovaIA from './pages/app/InnovaIA'
import Ejecutivo from './pages/app/Ejecutivo'

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

      {/* Plataforma interna del Comité */}
      <Route path="app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="portafolio" element={<Portafolio />} />
        <Route path="actas" element={<Actas />} />
        <Route path="factibilidad" element={<Factibilidad />} />
        <Route path="gantt" element={<Gantt />} />
        <Route path="conocimiento" element={<ConocimientoInterno />} />
        <Route path="comunicaciones" element={<Comunicaciones />} />
        <Route path="innovaia" element={<InnovaIA />} />
        <Route path="ejecutivo" element={<Ejecutivo />} />
      </Route>
    </Routes>
  )
}
