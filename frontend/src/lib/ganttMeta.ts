export type ProjectTaskType = 'HITO' | 'TAREA'
export type ProjectTaskStatus = 'PENDIENTE' | 'EN_DESARROLLO' | 'EN_RIESGO' | 'ATRASADO' | 'COMPLETADO' | 'CANCELADO'
export type ProjectTaskPriority = 'BAJA' | 'MEDIA' | 'ALTA'

interface MetaEntry {
  label: string
  color: string
  bg: string
}

/** Metadatos de presentación por estado de hito/tarea (color, etiqueta en español). */
export const TASK_STATUS_META: Record<ProjectTaskStatus, MetaEntry> = {
  PENDIENTE: { label: 'Pendiente', color: 'var(--slate-500)', bg: 'var(--surface-sunken)' },
  EN_DESARROLLO: { label: 'En desarrollo', color: 'var(--blue-500)', bg: 'var(--blue-50)' },
  EN_RIESGO: { label: 'En riesgo', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ATRASADO: { label: 'Atrasado', color: 'var(--red-600)', bg: 'var(--red-50)' },
  COMPLETADO: { label: 'Completado', color: 'var(--green-600)', bg: 'var(--green-50)' },
  CANCELADO: { label: 'Cancelado', color: 'var(--red-500)', bg: 'var(--red-50)' },
}

export const TASK_PRIORITY_META: Record<ProjectTaskPriority, MetaEntry> = {
  BAJA: { label: 'Baja', color: 'var(--slate-500)', bg: 'var(--surface-sunken)' },
  MEDIA: { label: 'Media', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ALTA: { label: 'Alta', color: 'var(--red-600)', bg: 'var(--red-50)' },
}

export const TASK_TYPE_META: Record<ProjectTaskType, { label: string }> = {
  HITO: { label: 'Hito' },
  TAREA: { label: 'Tarea' },
}

export const TASK_STATUS_ORDER: ProjectTaskStatus[] = [
  'PENDIENTE', 'EN_DESARROLLO', 'EN_RIESGO', 'ATRASADO', 'COMPLETADO', 'CANCELADO',
]
export const TASK_PRIORITY_ORDER: ProjectTaskPriority[] = ['BAJA', 'MEDIA', 'ALTA']
