import {
  Home, Users, FileText, BookOpen, Megaphone, CalendarDays, Sparkles, FolderKanban,
  LayoutGrid, GanttChartSquare, ClipboardCheck, BarChart3, ShieldCheck, UserCog,
  KeyRound, Settings, ScrollText, Lightbulb, Building2, Mail,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
  permission?: string
  /** Clave del módulo de navegación (capa "Acceso a Módulos"). Solo aplica a appNav. */
  moduleKey?: string
}
export interface NavGroup {
  title: string
  items: NavItem[]
}

/** Enlaces del portal público (barra superior). */
export const publicNav: NavItem[] = [
  { label: 'Inicio', to: '/', icon: Home, end: true },
  { label: 'Quiénes Somos', to: '/quienes-somos', icon: Users },
  { label: 'Política', to: '/politica', icon: FileText },
  { label: 'Proyectos', to: '/proyectos', icon: FolderKanban },
  { label: 'Observatorio', to: '/observatorio', icon: BookOpen },
  { label: 'Conocimiento', to: '/conocimiento', icon: BookOpen },
  { label: 'Eventos', to: '/eventos', icon: CalendarDays },
]

/** Grupos de navegación de la plataforma interna (sidebar). */
export const appNav: NavGroup[] = [
  {
    title: 'Gestión',
    items: [
      { label: 'Dashboard General', to: '/app', icon: LayoutGrid, end: true, moduleKey: 'dashboard' },
      { label: 'Banco de Ideas', to: '/app/ideas', icon: Lightbulb, permission: 'ideas.read', moduleKey: 'ideas' },
      { label: 'Proyectos', to: '/app/proyectos', icon: FolderKanban, moduleKey: 'projects' },
      { label: 'Actas', to: '/app/actas', icon: FileText, moduleKey: 'minutes' },
      { label: 'Factibilidad', to: '/app/factibilidad', icon: ClipboardCheck, moduleKey: 'factibilidad' },
      { label: 'Carta Gantt', to: '/app/gantt', icon: GanttChartSquare, moduleKey: 'gantt' },
    ],
  },
  {
    title: 'Conocimiento',
    items: [
      { label: 'Conocimiento', to: '/app/conocimiento', icon: BookOpen, moduleKey: 'knowledge' },
      { label: 'Comunicaciones', to: '/app/comunicaciones', icon: Megaphone, moduleKey: 'communications' },
    ],
  },
  {
    title: 'Inteligencia',
    items: [
      { label: 'InnovaIA', to: '/app/innovaia', icon: Sparkles, moduleKey: 'innovaia' },
      { label: 'Dashboard Ejecutivo', to: '/app/ejecutivo', icon: BarChart3, moduleKey: 'executive' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Contenido público', to: '/app/admin/contenido-publico', icon: ShieldCheck, permission: 'public_content.manage', moduleKey: 'public_content' },
      { label: 'Usuarios', to: '/app/admin/usuarios', icon: UserCog, permission: 'users.manage', moduleKey: 'users' },
      { label: 'Unidades y Servicios', to: '/app/admin/unidades', icon: Building2, permission: 'units.manage', moduleKey: 'units' },
      { label: 'Roles', to: '/app/admin/roles', icon: KeyRound, permission: 'roles.manage', moduleKey: 'roles' },
      { label: 'Configuración', to: '/app/admin/configuracion', icon: Settings, permission: 'settings.manage', moduleKey: 'settings' },
      { label: 'Correo', to: '/app/admin/correo', icon: Mail, permission: 'settings.manage', moduleKey: 'mail' },
      { label: 'Auditoría', to: '/app/admin/auditoria', icon: ScrollText, permission: 'audit.read', moduleKey: 'audit' },
    ],
  },
]
