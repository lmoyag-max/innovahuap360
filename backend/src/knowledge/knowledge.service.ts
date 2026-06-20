import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnowledgeItemDto } from './dto/create-knowledge-item.dto';
import { UpdateKnowledgeItemDto } from './dto/update-knowledge-item.dto';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(folder?: string) {
    return this.prisma.knowledgeItem.findMany({
      where: folder ? { folder } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.knowledgeItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Documento no encontrado');
    return item;
  }

  create(dto: CreateKnowledgeItemDto) {
    return this.prisma.knowledgeItem.create({ data: dto });
  }

  async update(id: string, dto: UpdateKnowledgeItemDto) {
    await this.findOne(id);
    return this.prisma.knowledgeItem.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.knowledgeItem.delete({ where: { id } });
  }

  async registerDownload(id: string) {
    await this.findOne(id);
    return this.prisma.knowledgeItem.update({ where: { id }, data: { downloads: { increment: 1 } } });
  }

  findPublic() {
    return this.prisma.knowledgeItem.findMany({ where: { isPublic: true }, orderBy: { createdAt: 'desc' } });
  }
}
