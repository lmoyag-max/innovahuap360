import { Injectable } from '@nestjs/common';
import { IdeaStatus, ProjectStage, RiskLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const IDEAS_IN_REVIEW: IdeaStatus[] = [IdeaStatus.EN_REVISION, IdeaStatus.OBSERVADA, IdeaStatus.FACTIBILIDAD];
const IDEAS_APPROVED: IdeaStatus[] = [IdeaStatus.APROBADA, IdeaStatus.EN_EJECUCION, IdeaStatus.CERRADA];

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
      this.prisma.idea.count(),
      this.prisma.idea.count({ where: { status: IdeaStatus.RECIBIDA } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_IN_REVIEW } } }),
      this.prisma.idea.count({ where: { status: { in: IDEAS_APPROVED } } }),
      this.prisma.idea.count({ where: { status: IdeaStatus.RECHAZADA } }),
    ]);

    const agreementsCompletionRate = agreementsTotal === 0 ? 0 : Math.round((agreementsDone / agreementsTotal) * 100);

    const [ideasByUnit, ideasByType] = await Promise.all([
      this.prisma.idea.groupBy({ by: ['unitId'], _count: { _all: true }, orderBy: { _count: { unitId: 'desc' } }, take: 5 }),
      this.prisma.idea.groupBy({ by: ['projectType'], _count: { _all: true } }),
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
      this.prisma.idea.count({ where: { status: { in: IDEAS_APPROVED } } }),
      this.prisma.idea.count({ where: { status: { in: [IdeaStatus.EN_EJECUCION, IdeaStatus.CERRADA] } } }),
      this.prisma.idea.groupBy({ by: ['unitId'], _count: { _all: true }, orderBy: { _count: { unitId: 'desc' } }, take: 5 }),
      this.prisma.$queryRaw<{ month: Date; count: bigint }[]>`
        SELECT date_trunc('month', "created_at") AS month, COUNT(*)::bigint AS count
        FROM "ideas"
        WHERE "created_at" >= NOW() - INTERVAL '6 months'
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
}
