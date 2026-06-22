import { Injectable } from '@nestjs/common';
import { ContentSection, IdeaStatus, ProjectStage, RiskLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const IDEAS_IN_REVIEW: IdeaStatus[] = [IdeaStatus.EN_REVISION, IdeaStatus.OBSERVADA, IdeaStatus.FACTIBILIDAD];
const IDEAS_APPROVED: IdeaStatus[] = [IdeaStatus.APROBADA, IdeaStatus.EN_EJECUCION, IdeaStatus.CERRADA];
const IDEAS_IMPLEMENTED: IdeaStatus[] = [IdeaStatus.EN_EJECUCION, IdeaStatus.CERRADA];

// Eventos públicos: frases genéricas y anónimas (sin nombres, ids ni datos de
// contacto) para alimentar "Actividad reciente" en el Inicio público. El
// historial real (con autor) sigue existiendo solo en los módulos internos.
const PUBLIC_IDEA_EVENT_LABEL: Partial<Record<IdeaStatus, string>> = {
  RECIBIDA: 'Nueva idea registrada en el Banco de Ideas',
  FACTIBILIDAD: 'Una idea avanzó a evaluación de factibilidad',
  APROBADA: 'Una idea fue aprobada por el Comité',
  EN_EJECUCION: 'Una idea fue convertida en proyecto',
};
const PUBLIC_STAGE_EVENT_LABEL: Partial<Record<ProjectStage, string>> = {
  PILOTO: 'Un proyecto inició su etapa de piloto',
  IMPLEMENTACION: 'Un proyecto fue implementado',
  ESCALAMIENTO: 'Un proyecto avanzó a escalamiento',
};
const PUBLIC_SECTION_LABEL: Partial<Record<ContentSection, string>> = {
  POLITICA: 'Política',
  PORTAFOLIO: 'Portafolio',
  OBSERVATORIO: 'Observatorio',
  CONOCIMIENTO: 'Conocimiento',
  EVENTOS: 'Eventos',
};
const PUBLIC_SECTIONS = Object.keys(PUBLIC_SECTION_LABEL) as ContentSection[];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getOverview() {
    const [
      totalActive,
      pilots,
      criticalRisks,
      stageGroups,
      agreementsTotal,
      agreementsDone,
      topRisks,
      upcomingAgreements,
      recentActivity,
      ideasTotal,
      ideasReceived,
      ideasInReview,
      ideasApproved,
      ideasRejected,
    ] = await Promise.all([
      this.prisma.project.count({ where: { stage: { notIn: [ProjectStage.CIERRE] } } }),
      this.prisma.project.count({ where: { stage: ProjectStage.PILOTO } }),
      this.prisma.project.count({ where: { riskLevel: RiskLevel.ALTO } }),
      this.prisma.project.groupBy({ by: ['stage'], _count: { _all: true } }),
      this.prisma.agreement.count(),
      this.prisma.agreement.count({ where: { state: 'CUMPLIDO' } }),
      this.prisma.project.findMany({
        where: { riskLevel: RiskLevel.ALTO },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, riskLevel: true, sponsor: true },
      }),
      this.prisma.agreement.findMany({
        where: { state: { in: ['PENDIENTE', 'EN_CURSO'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: { minute: { select: { title: true } } },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: { select: { fullName: true, initials: true } },
        },
      }),
      this.prisma.idea.count({ where: { deletedAt: null } }),
      this.prisma.idea.count({ where: { status: IdeaStatus.RECIBIDA, deletedAt: null } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_IN_REVIEW }, deletedAt: null } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_APPROVED }, deletedAt: null } }),
      this.prisma.idea.count({ where: { status: IdeaStatus.RECHAZADA, deletedAt: null } }),
    ]);

    const agreementsCompletionRate = agreementsTotal === 0 ? 0 : Math.round((agreementsDone / agreementsTotal) * 100);

    const [ideasByUnit, ideasByType] = await Promise.all([
      this.prisma.idea.groupBy({ by: ['unitId'], where: { deletedAt: null }, _count: { _all: true }, orderBy: { _count: { unitId: 'desc' } }, take: 5 }),
      this.prisma.idea.groupBy({ by: ['projectType'], where: { deletedAt: null }, _count: { _all: true } }),
    ]);
    const units = await this.prisma.unit.findMany({ where: { id: { in: ideasByUnit.map((u) => u.unitId) } } });
    const unitNameById = new Map(units.map((u) => [u.id, u.name]));

    return {
      kpis: {
        activeProjects: totalActive,
        pilotsInProgress: pilots,
        criticalRisks,
        agreementsCompletionRate,
      },
      stageDistribution: stageGroups.map((g) => ({ stage: g.stage, count: g._count._all })),
      topRisks,
      upcomingAgreements,
      recentActivity,
      ideas: {
        total: ideasTotal,
        received: ideasReceived,
        inReview: ideasInReview,
        approved: ideasApproved,
        rejected: ideasRejected,
        byUnit: ideasByUnit.map((u) => ({ unit: unitNameById.get(u.unitId) ?? u.unitId, count: u._count._all })),
        byType: ideasByType.map((t) => ({ projectType: t.projectType, count: t._count._all })),
      },
    };
  }

  async getExecutiveOverview() {
    const projectCount = await this.prisma.project.count();
    const pilotCount = await this.prisma.project.count({ where: { stage: ProjectStage.PILOTO } });
    const criticalRisks = await this.prisma.project.count({ where: { riskLevel: RiskLevel.ALTO } });

    // Indicadores institucionales curados manualmente por la administración
    // (beneficio estimado, beneficiarios, impacto por ámbito, etc.) vía
    // /admin/settings — no se inventan ni se calculan, son criterio de Dirección.
    const [curatedKpis, curatedImpact, curatedStrategicLines] = await Promise.all([
      this.settings.get<Record<string, unknown>[]>('executive_kpis'),
      this.settings.get<Record<string, unknown>[]>('executive_impact'),
      this.settings.get<Record<string, unknown>[]>('executive_strategic_lines'),
    ]);

    const [ideasApproved, ideasImplemented, ideasByUnit, ideasTrendRaw] = await Promise.all([
      this.prisma.idea.count({ where: { status: { in: IDEAS_APPROVED }, deletedAt: null } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_IMPLEMENTED }, deletedAt: null } }),
      this.prisma.idea.groupBy({ by: ['unitId'], where: { deletedAt: null }, _count: { _all: true }, orderBy: { _count: { unitId: 'desc' } }, take: 5 }),
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT date_trunc('month', "created_at") AS month, COUNT(*)::bigint AS count
        FROM "ideas"
        WHERE "created_at" >= NOW() - INTERVAL '6 months' AND "deleted_at" IS NULL
        GROUP BY 1 ORDER BY 1 ASC
      `,
    ]);
    const units = await this.prisma.unit.findMany({ where: { id: { in: ideasByUnit.map((u) => u.unitId) } } });
    const unitNameById = new Map(units.map((u) => [u.id, u.name]));

    return {
      projectCount,
      pilotCount,
      criticalRisks,
      curatedKpis: curatedKpis ?? [],
      curatedImpact: curatedImpact ?? [],
      curatedStrategicLines: curatedStrategicLines ?? [],
      ideas: {
        approved: ideasApproved,
        implemented: ideasImplemented,
        topUnits: ideasByUnit.map((u) => ({ unit: unitNameById.get(u.unitId) ?? u.unitId, count: u._count._all })),
        trend: ideasTrendRaw.map((r) => ({ month: r.month, count: Number(r.count) })),
      },
    };
  }

  /**
   * Indicadores reales para el Inicio público (sin sesión). Reutiliza
   * exactamente las mismas reglas de negocio ya usadas en el Dashboard
   * interno (IDEAS_APPROVED, IDEAS_IMPLEMENTED, stage notIn CIERRE, stage
   * PILOTO) — no se inventa ninguna regla nueva, solo se exponen agregados
   * de solo lectura. `progressPct`/`beneficiaries` son cifras curadas
   * manualmente por Dirección vía /admin/settings (mismo mecanismo que
   * `executive_impact`), null si no han sido configuradas — nunca se
   * calculan ni se inventan.
   */
  async getPublicSummary() {
    const [
      ideasReceived,
      ideasApproved,
      ideasImplemented,
      activeProjects,
      pilotsInProgress,
      projectsImplemented,
      progressPct,
      beneficiaries,
    ] = await Promise.all([
      this.prisma.idea.count({ where: { deletedAt: null } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_APPROVED }, deletedAt: null } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_IMPLEMENTED }, deletedAt: null } }),
      this.prisma.project.count({ where: { stage: { notIn: [ProjectStage.CIERRE] } } }),
      this.prisma.project.count({ where: { stage: ProjectStage.PILOTO } }),
      this.prisma.project.count({ where: { stage: ProjectStage.IMPLEMENTACION } }),
      this.settings.get<number>('public_home_progress_pct'),
      this.settings.get<number>('public_home_beneficiaries'),
    ]);

    return {
      ideasReceived,
      ideasApproved,
      ideasImplemented,
      activeProjects,
      pilotsInProgress,
      projectsImplemented,
      progressPct: typeof progressPct === 'number' ? progressPct : null,
      beneficiaries: typeof beneficiaries === 'number' ? beneficiaries : null,
    };
  }

  /**
   * Feed público de "actividad reciente": frases genéricas y anónimas
   * (sin nombre de solicitante, autor interno, ni título de proyecto salvo
   * que ya sea contenido publicado y público) derivadas de transiciones de
   * estado reales. El historial detallado con autor sigue solo en el
   * Dashboard interno (`recentActivity`, gateado por `dashboard.read`).
   */
  async getPublicActivity() {
    const [ideaEvents, stageEvents, contentEvents] = await Promise.all([
      this.prisma.ideaStatusHistory.findMany({
        where: { toStatus: { in: Object.keys(PUBLIC_IDEA_EVENT_LABEL) as IdeaStatus[] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { toStatus: true, createdAt: true },
      }),
      this.prisma.projectStageHistory.findMany({
        where: { toStage: { in: Object.keys(PUBLIC_STAGE_EVENT_LABEL) as ProjectStage[] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { toStage: true, createdAt: true },
      }),
      this.prisma.publicContent.findMany({
        where: { isPublished: true, section: { in: PUBLIC_SECTIONS } },
        orderBy: { publishedAt: 'desc' },
        take: 8,
        select: { section: true, title: true, publishedAt: true },
      }),
    ]);

    const events = [
      ...ideaEvents.map((e) => ({ label: PUBLIC_IDEA_EVENT_LABEL[e.toStatus]!, date: e.createdAt })),
      ...stageEvents.map((e) => ({ label: PUBLIC_STAGE_EVENT_LABEL[e.toStage]!, date: e.createdAt })),
      ...contentEvents
        .filter((e) => e.publishedAt)
        .map((e) => ({ label: `Nueva publicación en ${PUBLIC_SECTION_LABEL[e.section] ?? e.section}: ${e.title}`, date: e.publishedAt! })),
    ];

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }
}
