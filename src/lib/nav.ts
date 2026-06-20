import {
  Home, Users, FileText, BookOpen, Megaphone, CalendarDays, Sparkles, FolderKanban,
  LayoutGrid, GanttChartSquare, ClipboardCheck, BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
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
  { label: 'Portafolio', to: '/portafolio', icon: FolderKanban },
  { label: 'Observatorio', to: '/observatorio', icon: BookOpen },
  { label: 'Conocimiento', to: '/conocimiento', icon: BookOpen },
  { label: 'Eventos', to: '/eventos', icon: CalendarDays },
]

/** Grupos de navegación de la plataforma interna (sidebar). */
export const appNav: NavGroup[] = [
  {
    title: 'Gestión',
    items: [
      { label: 'Dashboard General', to: '/app', icon: LayoutGrid, end: true },
      { label: 'Portafolio', to: '/app/portafolio', icon: FolderKanban },
      { label: 'Actas', to: '/app/actas', icon: FileText },
      { label: 'Factibilidad', to: '/app/factibilidad', icon: ClipboardCheck },
      { label: 'Carta Gantt', to: '/app/gantt', icon: GanttChartSquare },
    ],
  },
  {
    title: 'Conocimiento',
    items: [
      { label: 'Conocimiento', to: '/app/conocimiento', icon: BookOpen },
      { label: 'Comunicaciones', to: '/app/comunicaciones', icon: Megaphone },
    ],
  },
  {
    title: 'Inteligencia',
    items: [
      { label: 'InnovaIA', to: '/app/innovaia', icon: Sparkles },
      { label: 'Dashboard Ejecutivo', to: '/app/ejecutivo', icon: BarChart3 },
    ],
  },
]
