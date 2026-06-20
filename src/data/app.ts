// ===== Dashboard General =====
export const comiteKpis = [
  { value: '36', label: 'Proyectos activos', sub: '+4 este trimestre', tone: 'var(--blue-500)' },
  { value: '9', label: 'Pilotos en curso', sub: '2 por evaluar', tone: 'var(--violet-500)' },
  { value: '5', label: 'Riesgos críticos', sub: 'requieren acción', tone: 'var(--accent)' },
  { value: '78%', label: 'Acuerdos cumplidos', sub: '+6 pts vs. mes', tone: 'var(--green-500)' },
]

export const etapas = [
  { name: 'Idea recibida', n: 42, pct: 100, color: 'var(--slate-400)' },
  { name: 'Factibilidad', n: 18, pct: 43, color: 'var(--blue-400)' },
  { name: 'Priorización', n: 11, pct: 26, color: 'var(--blue-500)' },
  { name: 'Desarrollo', n: 8, pct: 19, color: 'var(--violet-500)' },
  { name: 'Piloto', n: 9, pct: 21, color: 'var(--accent)' },
  { name: 'Implementación', n: 6, pct: 14, color: 'var(--amber-500)' },
  { name: 'Escalamiento', n: 5, pct: 12, color: 'var(--green-500)' },
]

export const riesgos = [
  { name: 'Integración HIS — Trazabilidad', level: 'ALTO', tone: 'var(--accent)', bg: 'var(--accent-50)', note: 'Dependencia de TI sin fecha' },
  { name: 'Financiamiento piloto IA triage', level: 'ALTO', tone: 'var(--accent)', bg: 'var(--accent-50)', note: 'Fondo en revisión' },
  { name: 'Disponibilidad de box clínico', level: 'MEDIO', tone: 'var(--amber-600)', bg: 'var(--amber-50)', note: 'Agenda saturada' },
]

export const reuniones = [
  { date: '18 JUN', time: '09:00', title: 'Sesión ordinaria del Comité', tag: 'Ordinaria' },
  { date: '25 JUN', time: '15:00', title: 'Demo Day · Pilotos Q2', tag: 'Especial' },
  { date: '02 JUL', time: '11:00', title: 'Revisión de portafolio', tag: 'Seguimiento' },
]

export const acuerdos = [
  { txt: 'Asignar sponsor a piloto IA triage', who: 'Dirección Médica', light: 'var(--accent)', state: 'Vencido' },
  { txt: 'Aprobar presupuesto trazabilidad', who: 'Subdirección', light: 'var(--amber-500)', state: 'En curso' },
  { txt: 'Publicar bases Fondo de Ideas 2026', who: 'Comunicaciones', light: 'var(--green-500)', state: 'Listo' },
  { txt: 'Validar indicadores de humanización', who: 'Calidad', light: 'var(--amber-500)', state: 'En curso' },
]

export const actividad = [
  { ini: 'MS', who: 'M. Soto', act: 'movió', obj: 'IA triage', tail: 'a Piloto · hace 2 h' },
  { ini: 'CD', who: 'C. Díaz', act: 'adjuntó acta a', obj: 'Sesión 11/06', tail: '· hace 5 h' },
  { ini: 'PR', who: 'P. Rivas', act: 'actualizó KPI de', obj: 'Trazabilidad', tail: '· ayer' },
  { ini: 'RC', who: 'R. Cárcamo', act: 'aprobó factibilidad de', obj: 'Tótem', tail: '· ayer' },
]

// ===== Portafolio Kanban =====
export interface KanbanCard {
  name: string; owner: string; ini: string; sponsor: string
  risk: string; rt: string; kpi: string; due: string
}
export interface KanbanColumn { stage: string; color: string; cards: KanbanCard[] }

export const kanban: KanbanColumn[] = [
  { stage: 'Idea', color: 'var(--slate-400)', cards: [
    { name: 'Recetario digital de alta', owner: 'A. Vera', ini: 'AV', sponsor: 'Farmacia', risk: 'bajo', rt: 'var(--green-500)', kpi: '—', due: '—' },
    { name: 'Señalética inclusiva urgencia', owner: 'L. Pino', ini: 'LP', sponsor: 'Calidad', risk: 'bajo', rt: 'var(--green-500)', kpi: '—', due: '—' },
  ] },
  { stage: 'Factibilidad', color: 'var(--blue-400)', cards: [
    { name: 'Tótem de autoatención', owner: 'P. Rivas', ini: 'PR', sponsor: 'TI', risk: 'medio', rt: 'var(--amber-500)', kpi: '-15% filas', due: '30 Jul' },
  ] },
  { stage: 'Priorización', color: 'var(--blue-500)', cards: [
    { name: 'Wearables monitoreo box', owner: 'J. Lagos', ini: 'JL', sponsor: 'UCI', risk: 'medio', rt: 'var(--amber-500)', kpi: 'alertas', due: '15 Ago' },
  ] },
  { stage: 'Desarrollo', color: 'var(--violet-500)', cards: [
    { name: 'App acompañamiento familias', owner: 'C. Díaz', ini: 'CD', sponsor: 'Humaniza', risk: 'medio', rt: 'var(--amber-500)', kpi: '+NPS', due: '20 Jul' },
  ] },
  { stage: 'Piloto', color: 'var(--accent)', cards: [
    { name: 'Triage digital con IA', owner: 'M. Soto', ini: 'MS', sponsor: 'Dir. Médica', risk: 'alto', rt: 'var(--accent)', kpi: '-22% espera', due: '10 Jul' },
    { name: 'Dashboard ocupación camas', owner: 'M. Soto', ini: 'MS', sponsor: 'Gestión', risk: 'bajo', rt: 'var(--green-500)', kpi: '8 unid.', due: '05 Jul' },
  ] },
  { stage: 'Implementación', color: 'var(--amber-500)', cards: [
    { name: 'Trazabilidad en tiempo real', owner: 'P. Rivas', ini: 'PR', sponsor: 'TI', risk: 'alto', rt: 'var(--accent)', kpi: '8 unid.', due: '28 Jun' },
  ] },
  { stage: 'Escalamiento', color: 'var(--green-500)', cards: [
    { name: 'Programa Humaniza Urgencia', owner: 'C. Díaz', ini: 'CD', sponsor: 'Dirección', risk: 'bajo', rt: 'var(--green-500)', kpi: '+31 NPS', due: 'En curso' },
  ] },
  { stage: 'Cierre', color: 'var(--slate-300)', cards: [
    { name: 'Kit bienvenida ingreso', owner: 'L. Pino', ini: 'LP', sponsor: 'Calidad', risk: 'bajo', rt: 'var(--green-500)', kpi: 'logrado', due: 'May 2026' },
  ] },
]

// ===== Actas =====
export const actas = [
  { sel: true, date: '11 JUN 2026', title: 'Sesión ordinaria N°12', n: '8 participantes', open: 2 },
  { sel: false, date: '28 MAY 2026', title: 'Sesión ordinaria N°11', n: '7 participantes', open: 0 },
  { sel: false, date: '14 MAY 2026', title: 'Sesión extraordinaria', n: '9 participantes', open: 1 },
  { sel: false, date: '30 ABR 2026', title: 'Sesión ordinaria N°10', n: '8 participantes', open: 0 },
]
export const actaParticipantes = ['RC', 'MS', 'PR', 'CD', 'AV', 'LP', 'JL', 'MG']
export const actaAcuerdos = [
  { txt: 'Aprobar avance del piloto de triage digital con IA', resp: 'Dr. M. Soto', due: '18 Jun', light: 'var(--green-500)', state: 'Cumplido' },
  { txt: 'Gestionar financiamiento de trazabilidad con Dirección', resp: 'Ing. P. Rivas', due: '25 Jun', light: 'var(--amber-500)', state: 'En curso' },
  { txt: 'Definir indicadores de humanización Q3', resp: 'EU. C. Díaz', due: '20 Jun', light: 'var(--accent)', state: 'Pendiente' },
]
export const actaCompromisos = [
  { txt: 'Enviar bases del Fondo de Ideas 2026', resp: 'Comunicaciones' },
  { txt: 'Coordinar Demo Day con auditorio', resp: 'Gestión' },
]

// ===== Factibilidad =====
export const factSteps = [
  { n: '1', l: 'Descripción', on: true },
  { n: '2', l: 'Evaluación', on: true },
  { n: '3', l: 'Recursos', on: false },
  { n: '4', l: 'Resultado', on: false },
]
export const factCriterios = [
  { name: 'Impacto en la atención', score: 82, color: 'var(--green-500)' },
  { name: 'Factibilidad técnica', score: 68, color: 'var(--blue-500)' },
  { name: 'Nivel de riesgo', score: 54, color: 'var(--amber-500)' },
  { name: 'Recursos requeridos', score: 61, color: 'var(--violet-500)' },
  { name: 'Humanización', score: 88, color: 'var(--accent)' },
  { name: 'Transformación digital', score: 79, color: 'var(--blue-600)' },
]
export const factTotal = 72

// ===== Carta Gantt =====
export const ganttMonths = ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov']
export const ganttRows = [
  { name: 'Levantamiento y diseño', owner: 'PR', off: 0, len: 18, pct: 100, color: 'var(--blue-500)' },
  { name: 'Desarrollo del piloto', owner: 'MS', off: 14, len: 30, pct: 70, color: 'var(--accent)' },
  { name: 'Integración con HIS', owner: 'PR', off: 30, len: 22, pct: 35, color: 'var(--violet-500)' },
  { name: 'Pruebas en box clínico', owner: 'JL', off: 48, len: 18, pct: 10, color: 'var(--amber-500)' },
  { name: 'Evaluación de resultados', owner: 'CD', off: 64, len: 16, pct: 0, color: 'var(--green-500)' },
  { name: 'Escalamiento a 8 unidades', owner: 'MS', off: 78, len: 20, pct: 0, color: 'var(--slate-400)' },
]

// ===== Conocimiento interno =====
export const conocFolders = [
  { l: 'Actas', n: 42 }, { l: 'Informes', n: 28 }, { l: 'Presentaciones', n: 19 },
  { l: 'Resoluciones', n: 11 }, { l: 'Convenios', n: 7 }, { l: 'Lecciones', n: 15 },
]
export const conocRecientes = [
  { title: 'Acta sesión ordinaria N°12', type: 'ACTA', when: 'hace 2 días', who: 'L. Pino' },
  { title: 'Informe de impacto — Triage IA', type: 'INFORME', when: 'hace 5 días', who: 'M. Soto' },
  { title: 'Resolución financiamiento Q3', type: 'RESOLUCIÓN', when: 'hace 1 semana', who: 'Dirección' },
  { title: 'Lecciones aprendidas — Tótem', type: 'LECCIÓN', when: 'hace 2 semanas', who: 'A. Vera' },
]

// ===== Comunicaciones =====
export const comCalendar = [
  { day: 'Lun 16', items: [{ t: 'Boletín Posta Innova #08', c: 'var(--accent)' }] },
  { day: 'Mié 18', items: [{ t: 'Cobertura sesión Comité', c: 'var(--blue-500)' }] },
  { day: 'Vie 20', items: [{ t: 'Cápsula: IA en urgencia', c: 'var(--violet-500)' }, { t: 'RRSS Demo Day', c: 'var(--green-500)' }] },
  { day: 'Lun 23', items: [{ t: 'Convocatoria Fondo Ideas', c: 'var(--amber-600)' }] },
  { day: 'Vie 27', items: [{ t: 'Resumen mensual', c: 'var(--accent)' }] },
]
export const comMetrics = [
  { v: '1.240', l: 'Lectores boletín', s: '+14%' },
  { v: '68%', l: 'Tasa de apertura', s: '+5 pts' },
  { v: '24', l: 'Publicaciones', s: 'este mes' },
  { v: '3.8k', l: 'Alcance RRSS', s: '+22%' },
]
export const comCampanas = [
  { name: 'Posta Innova — Boletín mensual', status: 'Activa', tone: 'var(--green-500)', bg: 'var(--green-50)', ch: 'Email · Intranet' },
  { name: 'Convocatoria Fondo de Ideas 2026', status: 'Programada', tone: 'var(--blue-600)', bg: 'var(--blue-50)', ch: 'RRSS · Afiches' },
  { name: 'Serie: Innovación que humaniza', status: 'En diseño', tone: 'var(--amber-600)', bg: 'var(--amber-50)', ch: 'Video · Cápsulas' },
]

// ===== InnovaIA =====
export const iaCaps = ['Generar un acta', 'Crear ficha de proyecto', 'Sugerir KPIs', 'Elaborar carta Gantt', 'Resumir reunión', 'Generar informe']
export const iaCard = {
  title: 'Triage digital asistido por IA',
  rows: [
    { k: 'Objetivo', v: 'Reducir el tiempo de espera en box de urgencia' },
    { k: 'Sponsor', v: 'Dirección Médica' },
    { k: 'Etapa', v: 'Piloto' },
    { k: 'KPI 1', v: 'Tiempo de espera −22%' },
    { k: 'KPI 2', v: 'Concordancia de categorización ≥ 90%' },
    { k: 'KPI 3', v: 'Satisfacción del equipo clínico' },
  ],
}

// ===== Dashboard Ejecutivo =====
export const ejecKpis = [
  { v: '$184M', l: 'Beneficio estimado anual', s: '+18% vs. 2025', tone: 'var(--green-500)' },
  { v: '36', l: 'Proyectos activos', s: '9 en piloto', tone: 'var(--blue-500)' },
  { v: '82.400', l: 'Beneficiarios', s: '+12% interanual', tone: 'var(--accent)' },
  { v: '5', l: 'Riesgos críticos', s: 'gestión activa', tone: 'var(--amber-600)' },
]
export const ejecImpacto = [
  { l: 'Clínico', pct: 78, color: 'var(--accent)' },
  { l: 'Gestión', pct: 64, color: 'var(--blue-500)' },
  { l: 'Digital', pct: 71, color: 'var(--violet-500)' },
  { l: 'Humanización', pct: 85, color: 'var(--green-500)' },
  { l: 'Investigación', pct: 42, color: 'var(--amber-500)' },
]
export const ejecLineas = [
  { l: 'Impacto institucional', v: 'Alto', pct: 84, color: 'var(--green-500)' },
  { l: 'Transformación digital', v: 'En avance', pct: 71, color: 'var(--blue-500)' },
  { l: 'Humanización', v: 'Destacado', pct: 88, color: 'var(--accent)' },
  { l: 'Sostenibilidad financiera', v: 'Estable', pct: 66, color: 'var(--violet-500)' },
]
