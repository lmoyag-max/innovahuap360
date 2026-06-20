import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';

@Injectable()
export class CommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.communication.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.communication.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Comunicación no encontrada');
    return item;
  }

  create(dto: CreateCommunicationDto) {
    return this.prisma.communication.create({
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined, metrics: dto.metrics as never },
    });
  }

  async update(id: string, dto: UpdateCommunicationDto) {
    await this.findOne(id);
    return this.prisma.communication.update({
      where: { id },
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined, metrics: dto.metrics as never },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.communication.delete({ where: { id } });
  }
}
