import { CriterioCategoria, FactibilidadResultado, RiesgoImpacto, RiesgoNivel, RiesgoProbabilidad } from '@prisma/client';

// Umbral de resultado — fácil de ajustar a futuro sin tocar la lógica de cálculo.
export const RESULT_THRESHOLDS = {
  FACTIBLE: 80, // >= 80
  FACTIBLE_CON_OBSERVACIONES: 60, // 60-79
  REQUIERE_MAYOR_ANALISIS: 40, // 40-59
  // < 40 => NO_FACTIBLE
};

export function resolveResultado(globalScore: number): FactibilidadResultado {
  if (globalScore >= RESULT_THRESHOLDS.FACTIBLE) return FactibilidadResultado.FACTIBLE;
  if (globalScore >= RESULT_THRESHOLDS.FACTIBLE_CON_OBSERVACIONES) return FactibilidadResultado.FACTIBLE_CON_OBSERVACIONES;
  if (globalScore >= RESULT_THRESHOLDS.REQUIERE_MAYOR_ANALISIS) return FactibilidadResultado.REQUIERE_MAYOR_ANALISIS;
  return FactibilidadResultado.NO_FACTIBLE;
}

// Matriz de nivel de riesgo (probabilidad x impacto).
export const RISK_LEVEL_MATRIX: Record<RiesgoProbabilidad, Record<RiesgoImpacto, RiesgoNivel>> = {
  BAJA: { BAJO: RiesgoNivel.BAJO, MEDIO: RiesgoNivel.BAJO, ALTO: RiesgoNivel.MEDIO },
  MEDIA: { BAJO: RiesgoNivel.BAJO, MEDIO: RiesgoNivel.MEDIO, ALTO: RiesgoNivel.ALTO },
  ALTA: { BAJO: RiesgoNivel.MEDIO, MEDIO: RiesgoNivel.ALTO, ALTO: RiesgoNivel.CRITICO },
};

// Categorías cuyos criterios alimentan el puntaje global (la evaluación
// económica es descriptiva, no se promedia).
export const SCORABLE_CATEGORIES: CriterioCategoria[] = [
  CriterioCategoria.TECNICA,
  CriterioCategoria.OPERACIONAL,
  CriterioCategoria.NORMATIVA,
];

const CRITERIA_TEMPLATE_NAMES: Record<CriterioCategoria, string[]> = {
  TECNICA: [
    'Disponibilidad tecnológica',
    'Infraestructura requerida',
    'Integración con sistemas existentes',
    'Seguridad de la información',
    'Escalabilidad',
    'Mantenibilidad',
    'Complejidad técnica',
    'Dependencias internas o externas',
  ],
  OPERACIONAL: [
    'Impacto en procesos',
    'Capacidad del equipo',
    'Recursos humanos requeridos',
    'Cambios en flujos de trabajo',
    'Capacitación necesaria',
    'Soporte posterior',
    'Nivel de adopción esperado',
  ],
  NORMATIVA: [
    'Protección de datos',
    'Normativa institucional',
    'Riesgos legales',
    'Consentimientos (si aplica)',
    'Seguridad informática',
    'Continuidad operacional',
  ],
};

export const DEFAULT_CRITERION_SCORE = 50;

export function buildCriteriaTemplate(): { categoria: CriterioCategoria; criterionName: string; score: number; sortOrder: number }[] {
  const rows: { categoria: CriterioCategoria; criterionName: string; score: number; sortOrder: number }[] = [];
  for (const categoria of SCORABLE_CATEGORIES) {
    CRITERIA_TEMPLATE_NAMES[categoria].forEach((criterionName, index) => {
      rows.push({ categoria, criterionName, score: DEFAULT_CRITERION_SCORE, sortOrder: index });
    });
  }
  return rows;
}

export const CATEGORY_LABEL: Record<CriterioCategoria, string> = {
  TECNICA: 'Técnica',
  OPERACIONAL: 'Operacional',
  NORMATIVA: 'Normativa',
};
