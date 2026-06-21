import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdeaStatus } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreatePublicIdeaDto } from './dto/create-public-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { buildFichaTecnicaDocx } from './ficha-tecnica.template';

const IDEA_INCLUDE = {
  unit: true,
  fichaUpload: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } },
  comments: { orderBy: { createdAt: 'desc' as const } },
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
} as const;

const STATUS_LABELS: Record<IdeaStatus, string> = {
  RECIBIDA: 'Recibida',
  EN_REVISION: 'En revisión',
  OBSERVADA: 'Observada',
  FACTIBILIDAD: 'En factibilidad',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  EN_EJECUCION: 'En ejecución',
  CERRADA: 'Cerrada',
};

@Injectable()
export class IdeasService {
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly uploads: UploadsService,
    config: ConfigService<AppConfig, true>,
  ) {
    this.frontendUrl = config.get('frontendUrl', { infer: true });
  }

  findAll(filters: { status?: IdeaStatus; unitId?: string; search?: string; deleted?: boolean }) {
    return this.prisma.idea.findMany({
      where: {
        status: filters.status,
        unitId: filters.unitId,
        title: filters.search ? { contains: filters.search, mode: 'insensitive' } : undefined,
        deletedAt: filters.deleted ? { not: null } : null,
      },
      include: { unit: true, _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const idea = await this.prisma.idea.findUnique({ where: { id }, include: IDEA_INCLUDE });
    if (!idea) throw new NotFoundException('Idea no encontrada');
    return idea;
  }

  async getStats() {
    const active = { deletedAt: null } as const;
    const [total, byStatus, byUnit, byType] = await Promise.all([
      this.prisma.idea.count({ where: active }),
      this.prisma.idea.groupBy({ by: ['status'], where: active, _count: { _all: true } }),
      this.prisma.idea.groupBy({ by: ['unitId'], where: active, _count: { _all: true }, orderBy: { _count: { unitId: 'desc' } }, take: 8 }),
      this.prisma.idea.groupBy({ by: ['projectType'], where: active, _count: { _all: true } }),
    ]);
    const units = await this.prisma.unit.findMany({ where: { id: { in: byUnit.map((u) => u.unitId) } } });
    const unitNameById = new Map(units.map((u) => [u.id, u.name]));

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
      byUnit: byUnit.map((u) => ({ unit: unitNameById.get(u.unitId) ?? u.unitId, count: u._count._all })),
      byType: byType.map((t) => ({ projectType: t.projectType, count: t._count._all })),
    };
  }

  // ---- Ficha técnica ----

  getFichaTecnicaTemplate() {
    return buildFichaTecnicaDocx();
  }

  async uploadFicha(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.uploads.register(file);
  }

  // ---- Postulación pública ----

  async createPublic(dto: CreatePublicIdeaDto) {
    const idea = await this.prisma.idea.create({
      data: { ...dto, status: IdeaStatus.RECIBIDA },
      include: IDEA_INCLUDE,
    });

    await this.prisma.ideaStatusHistory.create({
      data: { ideaId: idea.id, fromStatus: null, toStatus: IdeaStatus.RECIBIDA, changedByName: 'Postulante (portal público)' },
    });

    await this.notifyCreated(idea);
    return idea;
  }

  async update(id: string, dto: UpdateIdeaDto, changedByName: string) {
    const before = await this.findOne(id);

    const updated = await this.prisma.idea.update({
      where: { id },
      data: dto,
      include: IDEA_INCLUDE,
    });

    if (dto.status && dto.status !== before.status) {
      await this.prisma.ideaStatusHistory.create({
        data: { ideaId: id, fromStatus: before.status, toStatus: dto.status, changedByName, note: dto.triageNote },
      });
      await this.notifyStatusChanged(updated, dto.status, dto.triageNote);
      await this.audit.log({ action: 'ideas.status_change', entityType: 'idea', entityId: id, metadata: { from: before.status, to: dto.status } });
    }

    return updated;
  }

  async addComment(id: string, dto: AddCommentDto, authorId: string, authorName: string) {
    const idea = await this.findOne(id);
    const comment = await this.prisma.ideaComment.create({
      data: { ideaId: id, authorId, authorName, comment: dto.comment },
    });
    await this.audit.log({ userId: authorId, action: 'ideas.comment', entityType: 'idea', entityId: id });
    await this.notifyComment(idea, authorName, dto.comment);
    return comment;
  }

  async convertToProject(id: string, changedByName: string) {
    const idea = await this.findOne(id);
    if (idea.status === IdeaStatus.EN_EJECUCION || idea.status === IdeaStatus.CERRADA) {
      throw new BadRequestException('Esta idea ya fue convertida en proyecto');
    }
    if (idea.status !== IdeaStatus.APROBADA) {
      throw new ConflictException('Solo se puede convertir en proyecto una idea Aprobada');
    }

    const project = await this.prisma.project.create({
      data: {
        name: idea.title,
        description: idea.description,
        category: idea.projectType,
        ownerName: changedByName,
        sponsor: idea.proponentName,
      },
    });

    const updated = await this.prisma.idea.update({
      where: { id },
      data: { status: IdeaStatus.EN_EJECUCION, resultingProjectId: project.id },
      include: IDEA_INCLUDE,
    });

    await this.prisma.ideaStatusHistory.create({
      data: { ideaId: id, fromStatus: idea.status, toStatus: IdeaStatus.EN_EJECUCION, changedByName, note: `Convertida en proyecto: ${project.name}` },
    });
    await this.notifyStatusChanged(updated, IdeaStatus.EN_EJECUCION, `Tu idea fue convertida en el proyecto "${project.name}"`);

    return updated;
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id);
    const idea = await this.prisma.idea.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.log({ userId, action: 'ideas.delete', entityType: 'idea', entityId: id });
    return idea;
  }

  async restore(id: string, userId: string) {
    await this.findOne(id);
    const idea = await this.prisma.idea.update({ where: { id }, data: { deletedAt: null } });
    await this.audit.log({ userId, action: 'ideas.restore', entityType: 'idea', entityId: id });
    return idea;
  }

  // ---- Notificaciones (no bloquean el flujo si fallan) ----

  private async committeeEmails(): Promise<string[]> {
    const members = await this.prisma.committeeMember.findMany({
      where: { isActive: true },
      include: { user: { select: { email: true } } },
    });
    return members.map((m) => m.user.email);
  }

  private folio(ideaId: string): string {
    return `SOL-${ideaId.slice(0, 8).toUpperCase()}`;
  }

  private async notifyCreated(idea: { id: string; title: string; proponentName: string; email: string; unit?: { name: string } | null }) {
    const ideasUrl = `${this.frontendUrl}/app/ideas`;
    const vars = { proponentName: idea.proponentName, title: idea.title, folio: this.folio(idea.id), unitName: idea.unit?.name ?? '—' };

    await this.mail.sendIdeaCreatedApplicantEmail(idea.email, vars);

    const committee = await this.committeeEmails();
    await this.mail.sendIdeaCreatedCommitteeEmail(committee, { ...vars, ideasUrl });
  }

  private async notifyStatusChanged(idea: { title: string; proponentName: string; email: string }, status: IdeaStatus, note?: string) {
    await this.mail.sendIdeaStatusChangedEmail(idea.email, {
      proponentName: idea.proponentName,
      title: idea.title,
      statusLabel: STATUS_LABELS[status],
      note,
    });

    const committee = await this.committeeEmails();
    await this.mail.sendGenericNotificationEmail(
      committee,
      `Idea actualizada: ${idea.title}`,
      'Cambio de estado en el Banco de Ideas',
      `<p>La idea <strong>"${MailService.escapeHtml(idea.title)}"</strong> de ${MailService.escapeHtml(idea.proponentName)} cambió a <strong>${STATUS_LABELS[status]}</strong>.</p>`,
    );
  }

  private async notifyComment(idea: { title: string; proponentName: string; email: string }, authorName: string, comment: string) {
    await this.mail.sendGenericNotificationEmail(
      idea.email,
      `InnovaHUAP 360 — Nueva observación en "${idea.title}"`,
      'El Comité dejó una observación',
      `<p>Hola ${MailService.escapeHtml(idea.proponentName)},</p>
       <p>${MailService.escapeHtml(authorName)} dejó una observación en tu idea <strong>"${MailService.escapeHtml(idea.title)}"</strong>:</p>
       <p style="background:#f6f8fa;padding:10px;border-radius:6px;">${MailService.escapeHtml(comment)}</p>`,
    );
  }
}
