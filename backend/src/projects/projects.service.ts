import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStage, ProjectTask } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpsertTaskDto } from './dto/upsert-task.dto';
import { CreateTaskDependencyDto } from './dto/create-task-dependency.dto';
import { AttachTaskFileDto } from './dto/attach-task-file.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
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

// Campos de ProjectTask cuyo cambio queda trazado en ProjectTaskHistory.
const TRACKED_TASK_FIELDS = ['status', 'progressPct', 'startOffsetDays', 'durationDays', 'priority'] as const;

const TASK_INCLUDE = {
  dependsOn: { include: { dependsOn: { select: { id: true, name: true } } } },
  dependents: { include: { task: { select: { id: true, name: true } } } },
  attachments: { include: { upload: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { tasks: { where: { deletedAt: null } } } },
        ideas: { select: { id: true, title: true, proponentName: true } },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' }, include: TASK_INCLUDE },
        feasibility: { orderBy: { sortOrder: 'asc' } },
        ideas: { select: { id: true, title: true, proponentName: true, status: true, description: true, createdAt: true } },
      },
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

  async addTask(projectId: string, dto: UpsertTaskDto, changedByName?: string) {
    await this.ensureExists(projectId);
    const task = await this.prisma.projectTask.create({ data: { ...dto, projectId }, include: TASK_INCLUDE });
    await this.prisma.projectTaskHistory.create({
      data: { taskId: task.id, changedByName, field: 'creado', toValue: task.name },
    });
    return task;
  }

  async updateTask(projectId: string, taskId: string, dto: UpsertTaskDto, changedByName?: string) {
    const existing = await this.ensureTaskExists(projectId, taskId);
    await this.recordTaskHistory(existing, dto, changedByName);
    return this.prisma.projectTask.update({ where: { id: taskId }, data: dto, include: TASK_INCLUDE });
  }

  async removeTask(projectId: string, taskId: string, changedByName?: string) {
    await this.ensureTaskExists(projectId, taskId);
    await this.prisma.projectTaskHistory.create({
      data: { taskId, changedByName, field: 'eliminado' },
    });
    await this.prisma.projectTask.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
  }

  async reorderTasks(projectId: string, dto: ReorderTasksDto) {
    await this.ensureExists(projectId);
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.projectTask.updateMany({ where: { id, projectId }, data: { sortOrder: index } }),
      ),
    );
    return this.prisma.projectTask.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: TASK_INCLUDE,
    });
  }

  async getTaskHistory(projectId: string, taskId: string) {
    await this.ensureTaskExists(projectId, taskId);
    return this.prisma.projectTaskHistory.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' } });
  }

  // ---- Dependencias entre tareas ----

  async addDependency(projectId: string, taskId: string, dto: CreateTaskDependencyDto) {
    await this.ensureTaskExists(projectId, taskId);
    if (dto.dependsOnId === taskId) {
      throw new ConflictException('Una tarea no puede depender de sí misma');
    }
    await this.ensureTaskExists(projectId, dto.dependsOnId);
    await this.prisma.projectTaskDependency.upsert({
      where: { taskId_dependsOnId: { taskId, dependsOnId: dto.dependsOnId } },
      create: { taskId, dependsOnId: dto.dependsOnId },
      update: {},
    });
    return this.prisma.projectTask.findUnique({ where: { id: taskId }, include: TASK_INCLUDE });
  }

  async removeDependency(projectId: string, taskId: string, dependsOnId: string) {
    await this.ensureTaskExists(projectId, taskId);
    await this.prisma.projectTaskDependency.deleteMany({ where: { taskId, dependsOnId } });
  }

  // ---- Adjuntos / evidencias ----

  async addAttachment(projectId: string, taskId: string, dto: AttachTaskFileDto) {
    await this.ensureTaskExists(projectId, taskId);
    const upload = await this.prisma.upload.findUnique({ where: { id: dto.uploadId } });
    if (!upload) throw new NotFoundException('Archivo no encontrado');
    return this.prisma.projectTaskAttachment.create({
      data: { taskId, uploadId: dto.uploadId },
      include: { upload: true },
    });
  }

  async removeAttachment(projectId: string, taskId: string, attachmentId: string) {
    await this.ensureTaskExists(projectId, taskId);
    const attachment = await this.prisma.projectTaskAttachment.findFirst({ where: { id: attachmentId, taskId } });
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');
    await this.prisma.projectTaskAttachment.delete({ where: { id: attachmentId } });
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
    const task = await this.prisma.projectTask.findFirst({ where: { id: taskId, projectId, deletedAt: null } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  private async recordTaskHistory(existing: ProjectTask, dto: UpsertTaskDto, changedByName?: string) {
    const entries = TRACKED_TASK_FIELDS
      .filter((field) => dto[field] !== undefined && String(dto[field]) !== String(existing[field]))
      .map((field) => ({
        taskId: existing.id,
        changedByName,
        field,
        fromValue: String(existing[field]),
        toValue: String(dto[field]),
      }));
    if (entries.length === 0) return;
    await this.prisma.projectTaskHistory.createMany({ data: entries });
  }
}
