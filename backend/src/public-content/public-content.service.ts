import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { ContentSection, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateAboutContentDto } from './dto/about-content.dto';
import { CreateAboutMemberDto, UpdateAboutMemberDto } from './dto/about-member.dto';
import { CreateAboutAxisDto, UpdateAboutAxisDto } from './dto/about-axis.dto';
import { CreateAboutObjectiveDto, UpdateAboutObjectiveDto } from './dto/about-objective.dto';
import { CreateAboutValueDto, UpdateAboutValueDto } from './dto/about-value.dto';
import { CreateAboutDocumentDto, UpdateAboutDocumentDto } from './dto/about-document.dto';

function sanitizeBody(body?: string | null): string | undefined {
  if (body === undefined) return undefined;
  if (body === null) return undefined;
  return sanitizeHtml(body, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
  });
}

/** Quién y desde dónde dispara una acción administrativa, para auditoría. */
export interface ContentActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

const ABOUT_SLUG = 'quienes-somos';

@Injectable()
export class PublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly uploadsService: UploadsService,
  ) {}

  private audit(actor: ContentActor, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) {
    return this.auditService.log({
      userId: actor.userId,
      action,
      entityType,
      entityId,
      metadata,
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  }

  // ---- Administración ----

  findAllAdmin(section?: ContentSection) {
    return this.prisma.publicContent.findMany({
      where: section ? { section } : undefined,
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOneAdmin(id: string) {
    const item = await this.prisma.publicContent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Contenido no encontrado');
    return item;
  }

  async create(dto: CreateContentDto) {
    await this.assertSlugAvailable(dto.slug);
    return this.prisma.publicContent.create({
      data: {
        ...dto,
        body: sanitizeBody(dto.body),
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateContentDto) {
    const current = await this.findOneAdmin(id);
    if (dto.slug && dto.slug !== current.slug) await this.assertSlugAvailable(dto.slug);

    const becomingPublished = dto.isPublished === true && !current.isPublished;
    return this.prisma.publicContent.update({
      where: { id },
      data: {
        ...dto,
        body: sanitizeBody(dto.body),
        publishedAt: becomingPublished ? new Date() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.publicContent.delete({ where: { id } });
  }

  async setPublished(id: string, isPublished: boolean) {
    const current = await this.findOneAdmin(id);
    return this.prisma.publicContent.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished && !current.isPublished ? new Date() : current.publishedAt,
      },
    });
  }

  setFeatured(id: string, isFeatured: boolean) {
    return this.prisma.publicContent.update({ where: { id }, data: { isFeatured } });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((i) => this.prisma.publicContent.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })),
    );
  }

  private async assertSlugAvailable(slug: string) {
    const existing = await this.prisma.publicContent.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ya existe contenido con ese slug');
  }

  // ---- Portal público (solo contenido publicado) ----

  findPublished(section: ContentSection) {
    const where: Prisma.PublicContentWhereInput = { section, isPublished: true };
    return this.prisma.publicContent.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
  }

  async findPublishedBySlug(slug: string) {
    const item = await this.prisma.publicContent.findFirst({ where: { slug, isPublished: true } });
    if (!item) throw new NotFoundException('Contenido no encontrado');
    return item;
  }

  // ===================== Quiénes Somos =====================
  // Encabezado + descripción reutilizan `PublicContent` (fila única,
  // section=QUIENES_SOMOS, slug fijo). Integrantes/ejes/objetivos/valores/
  // documentos son listas propias (ver modelos About* en schema.prisma).

  async getAboutContent() {
    const existing = await this.prisma.publicContent.findUnique({ where: { slug: ABOUT_SLUG } });
    if (existing) return existing;
    return this.prisma.publicContent.create({
      data: { section: ContentSection.QUIENES_SOMOS, slug: ABOUT_SLUG, title: 'Quiénes somos', isPublished: false },
    });
  }

  async updateAboutContent(dto: UpdateAboutContentDto, actor: ContentActor) {
    const current = await this.getAboutContent();
    const becomingPublished = dto.isPublished === true && !current.isPublished;
    const becomingUnpublished = dto.isPublished === false && current.isPublished;

    const updated = await this.prisma.publicContent.update({
      where: { id: current.id },
      data: {
        title: dto.title,
        excerpt: dto.excerpt,
        body: sanitizeBody(dto.body),
        secondaryBody: sanitizeBody(dto.secondaryBody),
        mission: sanitizeBody(dto.mission),
        vision: sanitizeBody(dto.vision),
        purpose: sanitizeBody(dto.purpose),
        imageUrl: dto.imageUrl,
        isPublished: dto.isPublished,
        publishedAt: becomingPublished ? new Date() : undefined,
      },
    });

    await this.audit(
      actor,
      becomingPublished ? 'about.content.publish' : becomingUnpublished ? 'about.content.unpublish' : 'about.content.update',
      'public_content',
      updated.id,
    );
    return updated;
  }

  // ---- Integrantes ----

  listAboutMembers() {
    return this.prisma.aboutMember.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  private async findAboutMemberOrThrow(id: string) {
    const member = await this.prisma.aboutMember.findUnique({ where: { id } });
    if (!member) throw new NotFoundException('Integrante no encontrado');
    return member;
  }

  async createAboutMember(dto: CreateAboutMemberDto, actor: ContentActor) {
    const member = await this.prisma.aboutMember.create({ data: dto });
    await this.audit(actor, 'about.member.create', 'about_member', member.id, { name: member.name });
    return member;
  }

  async updateAboutMember(id: string, dto: UpdateAboutMemberDto, actor: ContentActor) {
    await this.findAboutMemberOrThrow(id);
    const member = await this.prisma.aboutMember.update({ where: { id }, data: dto });
    await this.audit(actor, 'about.member.update', 'about_member', id, { name: member.name });
    return member;
  }

  async removeAboutMember(id: string, actor: ContentActor) {
    const member = await this.findAboutMemberOrThrow(id);
    await this.prisma.aboutMember.delete({ where: { id } });
    if (member.photoUploadId) await this.uploadsService.deleteFile(member.photoUploadId);
    await this.audit(actor, 'about.member.delete', 'about_member', id, { name: member.name });
  }

  async setAboutMemberPhoto(id: string, file: Express.Multer.File, actor: ContentActor) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const member = await this.findAboutMemberOrThrow(id);
    const upload = await this.uploadsService.register(file, actor.userId);
    const updated = await this.prisma.aboutMember.update({ where: { id }, data: { photoUploadId: upload.id } });
    if (member.photoUploadId) await this.uploadsService.deleteFile(member.photoUploadId);
    await this.audit(actor, 'about.member.photo_update', 'about_member', id, { name: member.name });
    return updated;
  }

  async removeAboutMemberPhoto(id: string, actor: ContentActor) {
    const member = await this.findAboutMemberOrThrow(id);
    if (!member.photoUploadId) return member;
    const updated = await this.prisma.aboutMember.update({ where: { id }, data: { photoUploadId: null } });
    await this.uploadsService.deleteFile(member.photoUploadId);
    await this.audit(actor, 'about.member.photo_remove', 'about_member', id, { name: member.name });
    return updated;
  }

  async reorderAboutMembers(items: { id: string; sortOrder: number }[], actor: ContentActor) {
    await this.prisma.$transaction(items.map((i) => this.prisma.aboutMember.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    await this.audit(actor, 'about.member.reorder', 'about_member', 'bulk', { items });
  }

  // ---- Ejes de trabajo ----

  listAboutAxes() {
    return this.prisma.aboutAxis.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  private async findAboutAxisOrThrow(id: string) {
    const axis = await this.prisma.aboutAxis.findUnique({ where: { id } });
    if (!axis) throw new NotFoundException('Eje no encontrado');
    return axis;
  }

  async createAboutAxis(dto: CreateAboutAxisDto, actor: ContentActor) {
    const axis = await this.prisma.aboutAxis.create({ data: dto });
    await this.audit(actor, 'about.axis.create', 'about_axis', axis.id, { name: axis.name });
    return axis;
  }

  async updateAboutAxis(id: string, dto: UpdateAboutAxisDto, actor: ContentActor) {
    await this.findAboutAxisOrThrow(id);
    const axis = await this.prisma.aboutAxis.update({ where: { id }, data: dto });
    await this.audit(actor, 'about.axis.update', 'about_axis', id, { name: axis.name });
    return axis;
  }

  async removeAboutAxis(id: string, actor: ContentActor) {
    const axis = await this.findAboutAxisOrThrow(id);
    await this.prisma.aboutAxis.delete({ where: { id } });
    await this.audit(actor, 'about.axis.delete', 'about_axis', id, { name: axis.name });
  }

  async reorderAboutAxes(items: { id: string; sortOrder: number }[], actor: ContentActor) {
    await this.prisma.$transaction(items.map((i) => this.prisma.aboutAxis.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    await this.audit(actor, 'about.axis.reorder', 'about_axis', 'bulk', { items });
  }

  // ---- Objetivos ----

  listAboutObjectives() {
    return this.prisma.aboutObjective.findMany({ orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
  }

  private async findAboutObjectiveOrThrow(id: string) {
    const objective = await this.prisma.aboutObjective.findUnique({ where: { id } });
    if (!objective) throw new NotFoundException('Objetivo no encontrado');
    return objective;
  }

  async createAboutObjective(dto: CreateAboutObjectiveDto, actor: ContentActor) {
    const objective = await this.prisma.aboutObjective.create({ data: dto });
    await this.audit(actor, 'about.objective.create', 'about_objective', objective.id, { title: objective.title });
    return objective;
  }

  async updateAboutObjective(id: string, dto: UpdateAboutObjectiveDto, actor: ContentActor) {
    await this.findAboutObjectiveOrThrow(id);
    const objective = await this.prisma.aboutObjective.update({ where: { id }, data: dto });
    await this.audit(actor, 'about.objective.update', 'about_objective', id, { title: objective.title });
    return objective;
  }

  async removeAboutObjective(id: string, actor: ContentActor) {
    const objective = await this.findAboutObjectiveOrThrow(id);
    await this.prisma.aboutObjective.delete({ where: { id } });
    await this.audit(actor, 'about.objective.delete', 'about_objective', id, { title: objective.title });
  }

  async reorderAboutObjectives(items: { id: string; sortOrder: number }[], actor: ContentActor) {
    await this.prisma.$transaction(items.map((i) => this.prisma.aboutObjective.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    await this.audit(actor, 'about.objective.reorder', 'about_objective', 'bulk', { items });
  }

  // ---- Valores ----

  listAboutValues() {
    return this.prisma.aboutValue.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  private async findAboutValueOrThrow(id: string) {
    const value = await this.prisma.aboutValue.findUnique({ where: { id } });
    if (!value) throw new NotFoundException('Valor no encontrado');
    return value;
  }

  async createAboutValue(dto: CreateAboutValueDto, actor: ContentActor) {
    const value = await this.prisma.aboutValue.create({ data: dto });
    await this.audit(actor, 'about.value.create', 'about_value', value.id, { name: value.name });
    return value;
  }

  async updateAboutValue(id: string, dto: UpdateAboutValueDto, actor: ContentActor) {
    await this.findAboutValueOrThrow(id);
    const value = await this.prisma.aboutValue.update({ where: { id }, data: dto });
    await this.audit(actor, 'about.value.update', 'about_value', id, { name: value.name });
    return value;
  }

  async removeAboutValue(id: string, actor: ContentActor) {
    const value = await this.findAboutValueOrThrow(id);
    await this.prisma.aboutValue.delete({ where: { id } });
    await this.audit(actor, 'about.value.delete', 'about_value', id, { name: value.name });
  }

  async reorderAboutValues(items: { id: string; sortOrder: number }[], actor: ContentActor) {
    await this.prisma.$transaction(items.map((i) => this.prisma.aboutValue.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    await this.audit(actor, 'about.value.reorder', 'about_value', 'bulk', { items });
  }

  // ---- Documentos ----

  listAboutDocuments() {
    return this.prisma.aboutDocument.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { fileUpload: { select: { originalName: true, mimeType: true, sizeBytes: true } } } });
  }

  private async findAboutDocumentOrThrow(id: string) {
    const document = await this.prisma.aboutDocument.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Documento no encontrado');
    return document;
  }

  async createAboutDocument(dto: CreateAboutDocumentDto, file: Express.Multer.File, actor: ContentActor) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const upload = await this.uploadsService.register(file, actor.userId);
    const document = await this.prisma.aboutDocument.create({
      data: { name: dto.name, description: dto.description, fileUploadId: upload.id },
    });
    await this.audit(actor, 'about.document.create', 'about_document', document.id, { name: document.name });
    return document;
  }

  async updateAboutDocument(id: string, dto: UpdateAboutDocumentDto, actor: ContentActor) {
    const current = await this.findAboutDocumentOrThrow(id);
    const becomingPublished = dto.isPublished === true && !current.isPublished;
    const becomingUnpublished = dto.isPublished === false && current.isPublished;
    const document = await this.prisma.aboutDocument.update({ where: { id }, data: dto });
    await this.audit(
      actor,
      becomingPublished ? 'about.document.publish' : becomingUnpublished ? 'about.document.unpublish' : 'about.document.update',
      'about_document',
      id,
      { name: document.name },
    );
    return document;
  }

  async removeAboutDocument(id: string, actor: ContentActor) {
    const document = await this.findAboutDocumentOrThrow(id);
    await this.prisma.aboutDocument.delete({ where: { id } });
    await this.uploadsService.deleteFile(document.fileUploadId);
    await this.audit(actor, 'about.document.delete', 'about_document', id, { name: document.name });
  }

  async reorderAboutDocuments(items: { id: string; sortOrder: number }[], actor: ContentActor) {
    await this.prisma.$transaction(items.map((i) => this.prisma.aboutDocument.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    await this.audit(actor, 'about.document.reorder', 'about_document', 'bulk', { items });
  }

  // ---- Vista pública agregada ----

  async getPublicAbout() {
    const [content, members, axes, objectives, values, documents] = await Promise.all([
      this.prisma.publicContent.findUnique({ where: { slug: ABOUT_SLUG } }),
      this.prisma.aboutMember.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      this.prisma.aboutAxis.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      this.prisma.aboutObjective.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] }),
      this.prisma.aboutValue.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
      this.prisma.aboutDocument.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    ]);

    if (!content || !content.isPublished) {
      return { published: false, content: null, members: [], axes: [], objectives: [], values: [], documents: [] };
    }

    return {
      published: true,
      content: {
        title: content.title,
        excerpt: content.excerpt,
        body: content.body,
        secondaryBody: content.secondaryBody,
        mission: content.mission,
        vision: content.vision,
        purpose: content.purpose,
        imageUrl: content.imageUrl,
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        unit: m.unit,
        committeeRole: m.committeeRole,
        email: m.email,
        photoUrl: m.photoUploadId ? `/public/about/members/${m.id}/photo` : null,
      })),
      axes: axes.map((a) => ({ id: a.id, name: a.name, description: a.description, icon: a.icon })),
      objectives: objectives.map((o) => ({ id: o.id, title: o.title, description: o.description })),
      values: values.map((v) => ({ id: v.id, name: v.name, description: v.description })),
      documents: documents.map((d) => ({ id: d.id, name: d.name, description: d.description, fileUrl: `/public/about/documents/${d.id}/file` })),
    };
  }

  // ---- Servir archivos públicos (gateados por estado de publicación) ----

  async getPublicMemberPhotoFile(id: string) {
    const member = await this.prisma.aboutMember.findFirst({ where: { id, isActive: true }, include: { photoUpload: true } });
    if (!member?.photoUpload) throw new NotFoundException('Fotografía no encontrada');
    return member.photoUpload;
  }

  async getPublicDocumentFile(id: string) {
    const document = await this.prisma.aboutDocument.findFirst({ where: { id, isPublished: true }, include: { fileUpload: true } });
    if (!document) throw new NotFoundException('Documento no encontrado');
    return document.fileUpload;
  }
}
