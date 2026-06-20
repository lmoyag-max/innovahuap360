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
    const [totalActive, pilots, criticalRisks, stageGroups, agreementsTotal, agreementsDone, topRisks, upcomingAgreements] =
      await Promise.all([
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
    };
  }

  async getExecutiveOverview() {
    const projectCount = await this.prisma.project.count();
    const pilotCount = await this.prisma.project.count({ where: { stage: ProjectStage.PILOTO } });
    const criticalRisks = await this.prisma.project.count({ where: { riskLevel: RiskLevel.ALTO } });

    // KPIs institucionales curados manualmente por la administración
    // (beneficio estimado, beneficiarios, etc.) vía /admin/settings.
    const curatedKpis = await this.settings.get<Record<string, unknown>[]>('executive_kpis');

    return {
      projectCount,
      pilotCount,
      criticalRisks,
      curatedKpis: curatedKpis ?? [],
    };
  }
}
