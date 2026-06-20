import { Injectable } from '@nestjs/common';
import { ProjectStage, RiskLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

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
    ]);

    const agreementsCompletionRate = agreementsTotal === 0 ? 0 : Math.round((agreementsDone / agreementsTotal) * 100);

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

    return {
      projectCount,
      pilotCount,
      criticalRisks,
      curatedKpis: curatedKpis ?? [],
      curatedImpact: curatedImpact ?? [],
      curatedStrategicLines: curatedStrategicLines ?? [],
    };
  }
}
