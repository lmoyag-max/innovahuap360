export type ProjectStage =
  | 'IDEA'
  | 'FACTIBILIDAD'
  | 'PRIORIZACION'
  | 'DESARROLLO'
  | 'PILOTO'
  | 'IMPLEMENTACION'
  | 'ESCALAMIENTO'
  | 'CIERRE'

export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO'

interface StageMeta {
  label: string
  color: string
}

/** Metadatos de presentación de cada etapa del pipeline (orden, color, etiqueta en español). */
export const STAGES: Record<ProjectStage, StageMeta> = {
  IDEA: { label: 'Idea recibida', color: 'var(--slate-400)' },
  FACTIBILIDAD: { label: 'Factibilidad', color: 'var(--blue-400)' },
  PRIORIZACION: { label: 'Priorización', color: 'var(--blue-500)' },
  DESARROLLO: { label: 'Desarrollo', color: 'var(--violet-500)' },
  PILOTO: { label: 'Piloto', color: 'var(--accent)' },
  IMPLEMENTACION: { label: 'Implementación', color: 'var(--amber-500)' },
  ESCALAMIENTO: { label: 'Escalamiento', color: 'var(--green-500)' },
  CIERRE: { label: 'Cierre', color: 'var(--slate-300)' },
}

export const STAGE_ORDER: ProjectStage[] = [
  'IDEA', 'FACTIBILIDAD', 'PRIORIZACION', 'DESARROLLO', 'PILOTO', 'IMPLEMENTACION', 'ESCALAMIENTO', 'CIERRE',
]

export const RISK_META: Record<RiskLevel, { color: string; bg: string }> = {
  BAJO: { color: 'var(--green-500)', bg: 'var(--green-50)' },
  MEDIO: { color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ALTO: { color: 'var(--accent)', bg: 'var(--accent-50)' },
}

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'inició sesión',
  'auth.login_failed': 'intentó iniciar sesión (falló)',
  'auth.change_password': 'cambió su contraseña',
  'auth.reset_password': 'restableció su contraseña',
  'auth.forgot_password': 'solicitó recuperar su contraseña',
}

export function describeAction(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'hace instantes'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}
