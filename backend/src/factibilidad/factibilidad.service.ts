import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CriterioCategoria, FichaFactibilidadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { UploadsService } from '../uploads/uploads.service';
import { AuditService } from '../audit/audit.service';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { UpsertCriteriosDto } from './dto/upsert-criterios.dto';
import { UpsertRiesgosDto } from './dto/upsert-riesgos.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';
import { TransitionFichaStatusDto } from './dto/transition-ficha-status.dto';
import {
  CATEGORY_LABEL,
  RISK_LEVEL_MATRIX,
  SCORABLE_CATEGORIES,
  buildCriteriaTemplate,
  resolveResultado,
} from './factibilidad.constants';

const FICHA_INCLUDE = {
  criteria: { orderBy: { sortOrder: 'asc' } },
  risks: { orderBy: { sortOrder: 'asc' } },
  evidences: {
    orderBy: { sortOrder: 'asc' },
    include: { upload: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true } } },
  },
  unit: { select: { id: true, name: true } },
} satisfies Prisma.FactibilidadFichaInclude;

@Injectable()
export class FactibilidadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly uploads: UploadsService,
    private readonly audit: AuditService,
  ) {}

  // ---- Fichas ----

  findAllByProject(projectId: string, includeDeleted = false) {
    return this.prisma.factibilidadFicha.findMany({
      where: { projectId, deletedAt: includeDeleted ? undefined : null },
      orderBy: { updatedAt: 'desc' },
      include: { unit: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    const ficha = await this.prisma.factibilidadFicha.findUnique({ where: { id }, include: FICHA_INCLUDE });
    if (!ficha) throw new NotFoundException('Ficha de factibilidad no encontrada');
    return ficha;
  }

  async create(dto: CreateFichaDto, userId?: string) {
    const project = await this.projects.findOne(dto.projectId);

    const ficha = await this.prisma.factibilidadFicha.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        evaluationDate: new Date(dto.evaluationDate),
        responsibleName: dto.responsibleName,
        unitId: dto.unitId,
        evaluationObjective: dto.evaluationObjective,
        description: dto.description,
        estimatedCosts: dto.estimatedCosts,
        requiredResources: dto.requiredResources,
        licenses: dto.licenses,
        infrastructureCosts: dto.infrastructureCosts,
        manHours: dto.manHours,
        recurringCosts: dto.recurringCosts,
        expectedBenefit: dto.expectedBenefit,
        projectStageSnapshot: project.stage,
        criteria: { createMany: { data: buildCriteriaTemplate() } },
      },
      include: FICHA_INCLUDE,
    });

    await this.audit.log({ userId, action: 'factibilidad.create', entityType: 'factibilidad_ficha', entityId: ficha.id });
    return ficha;
  }

  async update(id: string, dto: UpdateFichaDto) {
    const ficha = await this.ensureExists(id);
    return this.prisma.factibilidadFicha.update({
      where: { id: ficha.id },
      data: {
        name: dto.name,
        evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : undefined,
        responsibleName: dto.responsibleName,
        unitId: dto.unitId,
        evaluationObjective: dto.evaluationObjective,
        description: dto.description,
        estimatedCosts: dto.estimatedCosts,
        requiredResources: dto.requiredResources,
        licenses: dto.licenses,
        infrastructureCosts: dto.infrastructureCosts,
        manHours: dto.manHours,
        recurringCosts: dto.recurringCosts,
        expectedBenefit: dto.expectedBenefit,
      },
      include: FICHA_INCLUDE,
    });
  }

  async softDelete(id: string, userId: string) {
    await this.ensureExists(id);
    const ficha = await this.prisma.factibilidadFicha.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId, action: 'factibilidad.delete', entityType: 'factibilidad_ficha', entityId: id });
    await this.syncLegacyFeasibility(ficha.projectId);
    return ficha;
  }

  async restore(id: string, userId: string) {
    const ficha = await this.ensureExists(id);
    const restored = await this.prisma.factibilidadFicha.update({ where: { id }, data: { deletedAt: null } });
    await this.audit.log({ userId, action: 'factibilidad.restore', entityType: 'factibilidad_ficha', entityId: id });
    await this.syncLegacyFeasibility(ficha.projectId);
    return restored;
  }

  async transitionStatus(id: string, dto: TransitionFichaStatusDto) {
    const ficha = await this.ensureExists(id);
    const updated = await this.prisma.factibilidadFicha.update({ where: { id }, data: { status: dto.status }, include: FICHA_INCLUDE });
    await this.audit.log({
      action: 'factibilidad.status_change',
      entityType: 'factibilidad_ficha',
      entityId: id,
      metadata: { from: ficha.status, to: dto.status },
    });
    return updated;
  }

  // ---- Criterios (técnica/operacional/normativa) ----

  async setCriteria(fichaId: string, dto: UpsertCriteriosDto) {
    const ficha = await this.ensureEditable(fichaId);

    const sortCounters: Record<CriterioCategoria, number> = { TECNICA: 0, OPERACIONAL: 0, NORMATIVA: 0 };
    const rows = dto.criteria.map((c) => ({
      categoria: c.categoria,
      criterionName: c.criterionName,
      score: c.score,
      sortOrder: sortCounters[c.categoria]++,
      fichaId,
    }));

    const { globalScore, result } = this.computeGlobalScoreAndResult(dto.criteria);

    await this.prisma.$transaction([
      this.prisma.factibilidadCriterio.deleteMany({ where: { fichaId } }),
      this.prisma.factibilidadCriterio.createMany({ data: rows }),
      this.prisma.factibilidadFicha.update({ where: { id: fichaId }, data: { globalScore, result } }),
    ]);

    await this.syncLegacyFeasibility(ficha.projectId);
    return this.findOne(fichaId);
  }

  // ---- Riesgos ----

  async setRisks(fichaId: string, dto: UpsertRiesgosDto) {
    await this.ensureEditable(fichaId);

    const rows = dto.risks.map((r, index) => ({
      fichaId,
      risk: r.risk,
      probability: r.probability,
      impact: r.impact,
      level: RISK_LEVEL_MATRIX[r.probability][r.impact],
      mitigation: r.mitigation,
      responsible: r.responsible,
      sortOrder: index,
    }));

    await this.prisma.$transaction([
      this.prisma.factibilidadRiesgo.deleteMany({ where: { fichaId } }),
      this.prisma.factibilidadRiesgo.createMany({ data: rows }),
    ]);

    return this.findOne(fichaId);
  }

  // ---- Evidencias ----

  async addEvidencia(fichaId: string, file: Express.Multer.File, description: string | undefined, uploadedById: string) {
    await this.ensureEditable(fichaId);
    const upload = await this.uploads.register(file, uploadedById);
    const count = await this.prisma.factibilidadEvidencia.count({ where: { fichaId } });
    await this.prisma.factibilidadEvidencia.create({
      data: { fichaId, uploadId: upload.id, description, sortOrder: count },
    });
    return this.findOne(fichaId);
  }

  async updateEvidencia(evidenciaId: string, dto: UpdateEvidenciaDto) {
    const evidencia = await this.findEvidenciaOrThrow(evidenciaId);
    await this.prisma.factibilidadEvidencia.update({ where: { id: evidenciaId }, data: { description: dto.description } });
    return this.findOne(evidencia.fichaId);
  }

  async removeEvidencia(evidenciaId: string) {
    const evidencia = await this.findEvidenciaOrThrow(evidenciaId);
    await this.ensureEditable(evidencia.fichaId);
    await this.prisma.factibilidadEvidencia.delete({ where: { id: evidenciaId } });
    await this.uploads.deleteFile(evidencia.uploadId);
    return this.findOne(evidencia.fichaId);
  }

  async getEvidenciaForDownload(evidenciaId: string) {
    const evidencia = await this.prisma.factibilidadEvidencia.findUnique({ where: { id: evidenciaId }, include: { upload: true } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    return evidencia.upload;
  }

  // ---- Resumen / Dashboard ----

  async getSummary() {
    const where = { deletedAt: null } as const;
    const [total, byResult, distinctProjects, pendientes] = await Promise.all([
      this.prisma.factibilidadFicha.count({ where }),
      this.prisma.factibilidadFicha.groupBy({ by: ['result'], where, _count: { _all: true } }),
      this.prisma.factibilidadFicha.findMany({ where, select: { projectId: true }, distinct: ['projectId'] }),
      this.prisma.factibilidadFicha.count({
        where: { ...where, OR: [{ result: null }, { status: { not: FichaFactibilidadStatus.FINALIZADA } }] },
      }),
    ]);

    const countFor = (result: string) => byResult.find((r) => r.result === result)?._count._all ?? 0;

    return {
      totalFichas: total,
      proyectosEvaluados: distinctProjects.length,
      factibles: countFor('FACTIBLE'),
      factiblesConObservaciones: countFor('FACTIBLE_CON_OBSERVACIONES'),
      noFactibles: countFor('NO_FACTIBLE'),
      pendientes,
    };
  }

  // ---- Privados ----

  private computeGlobalScoreAndResult(criteria: { categoria: CriterioCategoria; score: number }[]) {
    const scorable = criteria.filter((c) => SCORABLE_CATEGORIES.includes(c.categoria));
    if (scorable.length === 0) return { globalScore: null, result: null };
    const globalScore = Math.round(scorable.reduce((sum, c) => sum + c.score, 0) / scorable.length);
    return { globalScore, result: resolveResultado(globalScore) };
  }

  private async syncLegacyFeasibility(projectId: string) {
    const latest = await this.prisma.factibilidadFicha.findFirst({
      where: { projectId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { criteria: { orderBy: { sortOrder: 'asc' } } },
    });

    const rows = (latest?.criteria ?? []).map((c, index) => ({
      criterionName: `[${CATEGORY_LABEL[c.categoria]}] ${c.criterionName}`,
      score: c.score,
      sortOrder: index,
      projectId,
    }));

    await this.prisma.$transaction([
      this.prisma.feasibility.deleteMany({ where: { projectId } }),
      this.prisma.feasibility.createMany({ data: rows }),
    ]);
  }

  private async ensureExists(id: string) {
    const ficha = await this.prisma.factibilidadFicha.findUnique({ where: { id } });
    if (!ficha) throw new NotFoundException('Ficha de factibilidad no encontrada');
    return ficha;
  }

  private async ensureEditable(id: string) {
    const ficha = await this.ensureExists(id);
    if (ficha.status === FichaFactibilidadStatus.FINALIZADA) {
      throw new ConflictException('La ficha está finalizada. Reábrela (vuelve a "En evaluación") para poder editarla.');
    }
    return ficha;
  }

  private async findEvidenciaOrThrow(evidenciaId: string) {
    const evidencia = await this.prisma.factibilidadEvidencia.findUnique({ where: { id: evidenciaId } });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');
    return evidencia;
  }
}
