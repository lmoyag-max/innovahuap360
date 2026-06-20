import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpsertTaskDto } from './dto/upsert-task.dto';
import { SetFeasibilityDto } from './dto/set-feasibility.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';

// Gate mínimo de gobernanza: para avanzar a estas etapas el proyecto debe
// tener al menos una evaluación de factibilidad registrada. Es un primer
// criterio explícito y auditable; reglas adicionales (configurables desde
// Administración) son la siguiente iteración natural de este pipeline.
const STAGES_REQUIRING_FEASIBILITY: ProjectStage[] = [
  ProjectStage.PILOTO,
  ProjectStage.IMPLEMENTACION,
  ProjectStage.ESCALAMIENTO,
];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { tasks: { orderBy: { sortOrder: 'asc' } }, feasibility: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.ensureExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.project.delete({ where: { id } });
  }

  // ---- Tareas (carta Gantt) ----

  async addTask(projectId: string, dto: UpsertTaskDto) {
    await this.ensureExists(projectId);
    return this.prisma.projectTask.create({ data: { ...dto, projectId } });
  }

  async updateTask(projectId: string, taskId: string, dto: UpsertTaskDto) {
    await this.ensureTaskExists(projectId, taskId);
    return this.prisma.projectTask.update({ where: { id: taskId }, data: dto });
  }

  async removeTask(projectId: string, taskId: string) {
    await this.ensureTaskExists(projectId, taskId);
    await this.prisma.projectTask.delete({ where: { id: taskId } });
  }

  // ---- Factibilidad ----

  async setFeasibility(projectId: string, dto: SetFeasibilityDto) {
    await this.ensureExists(projectId);
    await this.prisma.$transaction([
      this.prisma.feasibility.deleteMany({ where: { projectId } }),
      this.prisma.feasibility.createMany({
        data: dto.criteria.map((c, index) => ({ ...c, projectId, sortOrder: index })),
      }),
    ]);
    return this.prisma.feasibility.findMany({ where: { projectId }, orderBy: { sortOrder: 'asc' } });
  }

  // ---- Pipeline de Innovación (gobernanza de etapas) ----

  async transitionStage(id: string, dto: TransitionStageDto, changedByName: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { feasibility: true },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    if (
      STAGES_REQUIRING_FEASIBILITY.includes(dto.stage) &&
      project.feasibility.length === 0 &&
      !STAGES_REQUIRING_FEASIBILITY.includes(project.stage)
    ) {
      throw new ConflictException(
        'No se puede avanzar a esta etapa sin registrar al menos una evaluación de factibilidad',
      );
    }

    const [updated, history] = await this.prisma.$transaction([
      this.prisma.project.update({ where: { id }, data: { stage: dto.stage } }),
      this.prisma.projectStageHistory.create({
        data: { projectId: id, fromStage: project.stage, toStage: dto.stage, changedByName, note: dto.note },
      }),
    ]);
    return { ...updated, lastTransition: history };
  }

  getStageHistory(projectId: string) {
    return this.prisma.projectStageHistory.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Portal público ----

  findPublic() {
    return this.prisma.project.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Proyecto no encontrado');
  }

  private async ensureTaskExists(projectId: string, taskId: string) {
    const exists = await this.prisma.projectTask.findFirst({ where: { id: taskId, projectId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Tarea no encontrada');
  }
}
