import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMinuteDto } from './dto/create-minute.dto';
import { UpdateMinuteDto } from './dto/update-minute.dto';
import { UpsertAgreementDto } from './dto/upsert-agreement.dto';

@Injectable()
export class MinutesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.minute.findMany({
      orderBy: { sessionDate: 'desc' },
      include: { _count: { select: { agreements: true } } },
    });
  }

  async findOne(id: string) {
    const minute = await this.prisma.minute.findUnique({
      where: { id },
      include: { agreements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!minute) throw new NotFoundException('Acta no encontrada');
    return minute;
  }

  create(dto: CreateMinuteDto) {
    return this.prisma.minute.create({
      data: { ...dto, sessionDate: new Date(dto.sessionDate) },
    });
  }

  async update(id: string, dto: UpdateMinuteDto) {
    await this.ensureExists(id);
    return this.prisma.minute.update({
      where: { id },
      data: { ...dto, sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : undefined },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.minute.delete({ where: { id } });
  }

  async addAgreement(minuteId: string, dto: UpsertAgreementDto) {
    await this.ensureExists(minuteId);
    return this.prisma.agreement.create({
      data: { ...dto, minuteId, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async updateAgreement(minuteId: string, agreementId: string, dto: UpsertAgreementDto) {
    await this.ensureAgreementExists(minuteId, agreementId);
    return this.prisma.agreement.update({
      where: { id: agreementId },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async removeAgreement(minuteId: string, agreementId: string) {
    await this.ensureAgreementExists(minuteId, agreementId);
    await this.prisma.agreement.delete({ where: { id: agreementId } });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.minute.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Acta no encontrada');
  }

  private async ensureAgreementExists(minuteId: string, agreementId: string) {
    const exists = await this.prisma.agreement.findFirst({
      where: { id: agreementId, minuteId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Acuerdo no encontrado');
  }
}
