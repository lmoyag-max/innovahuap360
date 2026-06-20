import type { Project } from '../components/ui'

/** KPIs del hero / inicio público. */
export const kpis = [
  { value: '248', label: 'Ideas recibidas', trend: '+18 este mes' },
  { value: '36', label: 'Proyectos activos', trend: '+4 vs. trimestre' },
  { value: '9', label: 'Pilotos en ejecución', trend: '2 por evaluar' },
  { value: '14', label: 'Iniciativas implementadas', trend: '+3 este año' },
  { value: '82.400', label: 'Beneficiarios alcanzados', trend: '+12% interanual' },
]

export const destacados: Project[] = [
  { name: 'Triage digital asistido por IA', desc: 'Priorización clínica automática en box de urgencia con apoyo de IA.', stage: 'PILOTO', owner: 'Dr. M. Soto', kpi: '-22% espera', bar: 'linear-gradient(90deg,#6d49d6,#9b80e8)' },
  { name: 'Trazabilidad de pacientes', desc: 'Tablero de flujo y ocupación de camas integrado al HIS.', stage: 'IMPLEMENTACIÓN', owner: 'Ing. P. Rivas', kpi: '8 unidades', bar: 'linear-gradient(90deg,#2a6fdb,#5d8ff2)' },
  { name: 'Programa Humaniza Urgencia', desc: 'Rediseño de la experiencia de acompañamiento a familias.', stage: 'ESCALAMIENTO', owner: 'EU. C. Díaz', kpi: '+31 NPS', bar: 'linear-gradient(90deg,#ed1d25,#ff6b6b)' },
]

export const noticias = [
  { day: '12', mon: 'Jun', title: 'Posta Central lanza laboratorio de innovación clínica', tag: 'Innovación · Comunicado' },
  { day: '04', mon: 'Jun', title: 'El piloto de triage digital supera su meta de tiempos', tag: 'Proyectos · Resultados' },
  { day: '28', mon: 'May', title: 'Convocatoria abierta: Fondo de Ideas 2026', tag: 'Convocatoria' },
]

export const actividades = [
  { title: 'Sesión ordinaria del Comité', when: '18 JUN · 09:00 · Sala Dirección', color: 'var(--accent)' },
  { title: 'Demo Day · Pilotos Q2', when: '25 JUN · 15:00 · Auditorio', color: 'var(--blue-500)' },
  { title: 'Jornada de Humanización', when: '02 JUL · 11:00 · Hall central', color: 'var(--violet-500)' },
]

export const ecosistema = ['MINSAL', 'Servicio de Salud', 'Universidades', 'Startups HealthTech', 'Sociedades científicas', 'Pacientes']

export const integrantes = [
  { name: 'Dra. Rosa Cárcamo', role: 'Coordinadora del Comité', ini: 'RC' },
  { name: 'Dr. Manuel Soto', role: 'Dirección Médica', ini: 'MS' },
  { name: 'Ing. Pablo Rivas', role: 'Transformación Digital', ini: 'PR' },
  { name: 'EU. Carolina Díaz', role: 'Humanización y Cuidados', ini: 'CD' },
  { name: 'Sr. Andrés Vera', role: 'Gestión y Calidad', ini: 'AV' },
  { name: 'Sra. Laura Pino', role: 'Comunicaciones', ini: 'LP' },
]

export const gobernanza = [
  { step: '01', title: 'Recepción de ideas', desc: 'Funcionarios y usuarios postulan a través del portal.' },
  { step: '02', title: 'Evaluación de factibilidad', desc: 'El Comité aplica la ficha institucional de evaluación.' },
  { step: '03', title: 'Priorización y desarrollo', desc: 'Se asignan sponsors, recursos y plan de trabajo.' },
  { step: '04', title: 'Piloto, implementación y escalamiento', desc: 'Seguimiento por indicadores hasta generar impacto.' },
]

export const politicaDocs = [
  { title: 'Política de Innovación HUAP', type: 'POLÍTICA', date: '2026', size: '2.4 MB', color: 'var(--accent)' },
  { title: 'Reglamento del Comité de Innovación', type: 'REGLAMENTO', date: '2026', size: '1.1 MB', color: 'var(--blue-500)' },
  { title: 'Resolución de constitución', type: 'RESOLUCIÓN', date: '2025', size: '480 KB', color: 'var(--slate-500)' },
  { title: 'Plan de trabajo 2026–2027', type: 'PLAN', date: '2026', size: '3.2 MB', color: 'var(--violet-500)' },
  { title: 'Plan comunicacional 2026–2027', type: 'PLAN', date: '2026', size: '2.8 MB', color: 'var(--green-500)' },
  { title: 'Manual de gobernanza de innovación', type: 'MANUAL', date: '2026', size: '1.9 MB', color: 'var(--amber-500)' },
]

export const filtros = ['Todos', 'Clínicos', 'Gestión', 'Transformación Digital', 'Humanización', 'IA', 'Investigación']

export const proyectosPub = [
  { name: 'Triage digital asistido por IA', cat: 'IA', cc: 'var(--violet-500)', stage: 'Piloto', desc: 'Priorización clínica automática en box de urgencia.', impact: '-22% tiempo de espera', owner: 'Dr. M. Soto' },
  { name: 'Trazabilidad de pacientes en tiempo real', cat: 'Transformación Digital', cc: 'var(--blue-500)', stage: 'Implementación', desc: 'Tablero de flujo y ocupación integrado al HIS.', impact: '8 unidades conectadas', owner: 'Ing. P. Rivas' },
  { name: 'Programa Humaniza Urgencia', cat: 'Humanización', cc: 'var(--accent)', stage: 'Escalamiento', desc: 'Rediseño del acompañamiento a familias.', impact: '+31 puntos NPS', owner: 'EU. C. Díaz' },
  { name: 'Tótem de autoatención', cat: 'Gestión', cc: 'var(--amber-500)', stage: 'Factibilidad', desc: 'Registro y orientación sin filas en admisión.', impact: '-15% filas estimado', owner: 'Sr. A. Vera' },
  { name: 'Wearables de monitoreo en box', cat: 'Clínicos', cc: 'var(--green-500)', stage: 'Priorización', desc: 'Signos vitales continuos con alertas tempranas.', impact: 'alertas en tiempo real', owner: 'Dr. J. Lagos' },
  { name: 'Observatorio de evidencia clínica', cat: 'Investigación', cc: 'var(--slate-500)', stage: 'Desarrollo', desc: 'Repositorio de estudios y resultados del hospital.', impact: '12 publicaciones', owner: 'Dra. R. Cárcamo' },
]

export const obsFeatured = {
  cat: 'IA EN SALUD',
  title: 'Cómo la inteligencia artificial está redefiniendo el triage de urgencia',
  excerpt: 'Una mirada a los primeros resultados del piloto del HUAP y las tendencias internacionales en priorización clínica asistida.',
  date: '12 Jun 2026',
}

export const obsArticles = [
  { cat: 'TENDENCIAS', title: '5 tecnologías que transformarán la urgencia hospitalaria', date: '10 Jun', color: 'var(--blue-500)' },
  { cat: 'CASOS DE ÉXITO', title: 'Trazabilidad en tiempo real: el caso de la Posta Central', date: '06 Jun', color: 'var(--green-500)' },
  { cat: 'TRANSFORMACIÓN DIGITAL', title: 'Interoperabilidad: el desafío pendiente de la salud pública', date: '02 Jun', color: 'var(--violet-500)' },
  { cat: 'PUBLICACIONES', title: 'Humanización y experiencia del paciente en urgencia', date: '28 May', color: 'var(--accent)' },
]

export const recursos = [
  { title: 'Caso de éxito: Triage digital', type: 'CASO DE ÉXITO', meta: 'PDF · 1.8 MB · 340 descargas' },
  { title: 'Lecciones aprendidas — Pilotos 2025', type: 'LECCIONES', meta: 'PDF · 920 KB · 210 descargas' },
  { title: 'Guía para postular una idea', type: 'GUÍA', meta: 'PDF · 540 KB · 1.2k descargas' },
  { title: 'Presentación del Comité 2026', type: 'PRESENTACIÓN', meta: 'PDF · 4.1 MB · 98 descargas' },
  { title: 'Publicación: Humanización en urgencia', type: 'PUBLICACIÓN', meta: 'PDF · 2.2 MB · 156 descargas' },
  { title: 'Informe de impacto anual', type: 'INFORME', meta: 'PDF · 3.6 MB · 87 descargas' },
]

export const eventos = [
  { day: '18', mon: 'JUN', title: 'Sesión ordinaria del Comité de Innovación', type: 'Sesión', tc: 'var(--accent)', place: 'Sala Dirección', time: '09:00' },
  { day: '25', mon: 'JUN', title: 'Demo Day · Pilotos del segundo trimestre', type: 'Jornada', tc: 'var(--blue-500)', place: 'Auditorio Central', time: '15:00' },
  { day: '02', mon: 'JUL', title: 'Jornada de Humanización en Urgencia', type: 'Jornada', tc: 'var(--violet-500)', place: 'Hall principal', time: '11:00' },
  { day: '09', mon: 'JUL', title: 'Capacitación: metodologías ágiles en salud', type: 'Capacitación', tc: 'var(--green-500)', place: 'Sala de formación', time: '14:30' },
  { day: '15', mon: 'JUL', title: 'Convocatoria: Fondo de Ideas 2026 — cierre', type: 'Convocatoria', tc: 'var(--amber-600)', place: 'En línea', time: '23:59' },
]
