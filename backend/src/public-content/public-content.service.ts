import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { ContentSection, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

function sanitizeBody(body?: string | null): string | undefined {
  if (body === undefined) return undefined;
  if (body === null) return undefined;
  return sanitizeHtml(body, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
  });
}

@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

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
}
