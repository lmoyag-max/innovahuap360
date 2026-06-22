import { ExternalLink } from 'lucide-react'
import SectionItemsAdmin from './SectionItemsAdmin'

/** Portafolio Público: publicaciones propias e independientes del
 * seguimiento interno de proyectos. CRUD completo (crear, editar,
 * eliminar, publicar/ocultar, destacar, reordenar, duplicar) sobre
 * `public_content` (section=PORTAFOLIO). Puede vincular opcionalmente
 * un proyecto interno solo como referencia — eliminar una publicación
 * pública nunca borra ni modifica el proyecto real. La gestión del
 * proyecto en sí (etapa, riesgo, tareas, factibilidad) sigue siendo
 * exclusiva del módulo Proyectos. */
export default function PortafolioAdmin() {
  return (
    <div>
      <p className="text-[12.5px] text-muted mb-4">
        Administra las publicaciones que aparecen en <strong>/proyectos</strong>. Son independientes del
        seguimiento real de cada proyecto — puedes vincular una a un proyecto interno solo como referencia. La
        gestión de etapas, riesgo y tareas sigue en{' '}
        <a href="/app/proyectos" className="font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}>
          Proyectos <ExternalLink size={12} />
        </a>.
      </p>
      <SectionItemsAdmin section="PORTAFOLIO" showPortfolioFields />
    </div>
  )
}
