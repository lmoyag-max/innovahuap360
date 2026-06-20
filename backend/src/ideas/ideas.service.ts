import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IdeaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicIdeaDto } from './dto/create-public-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';

@Injectable()
export class IdeasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: IdeaStatus) {
    return this.prisma.idea.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const idea = await this.prisma.idea.findUnique({ where: { id } });
    if (!idea) throw new NotFoundException('Idea no encontrada');
    return idea;
  }

  createPublic(dto: CreatePublicIdeaDto) {
    return this.prisma.idea.create({ data: { ...dto, status: IdeaStatus.RECIBIDA } });
  }

  async update(id: string, dto: UpdateIdeaDto) {
    await this.ensureExists(id);
    return this.prisma.idea.update({ where: { id }, data: dto });
  }

  async convertToProject(id: string, ownerName: string) {
    const idea = await this.findOne(id);
    if (idea.status === IdeaStatus.CONVERTIDA) {
      throw new BadRequestException('Esta idea ya fue convertida en proyecto');
    }

    const project = await this.prisma.project.create({
      data: {
        name: idea.title,
        description: idea.description,
        category: idea.scope ?? undefined,
        ownerName,
        sponsor: idea.proponentName,
      },
    });

    return this.prisma.idea.update({
      where: { id },
      data: { status: IdeaStatus.CONVERTIDA, resultingProjectId: project.id },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.idea.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Idea no encontrada');
  }
}
