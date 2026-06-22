import { Injectable, NotFoundException } from '@nestjs/common';
import { MinuteStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateMinuteDto } from './dto/create-minute.dto';
import { UpdateMinuteDto } from './dto/update-minute.dto';
import { UpsertAgreementDto } from './dto/upsert-agreement.dto';

const DOCUMENT_UPLOAD_SELECT = { id: true, originalName: true, sizeBytes: true } as const;

export interface FindAllMinutesFilters {
  search?: string;
  year?: string;
  month?: string;
  type?: 'ORDINARIA' | 'EXTRAORDINARIA';
  secretary?: string;
  status?: MinuteStatus;
  tag?: string;
}

@Injectable()
export class MinutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async findAll(filters: FindAllMinutesFilters = {}) {
    const { search, year, month, type, secretary, status, tag } = filters;

    let participantMatchIds: string[] | undefined;
    if (search) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM minutes
        WHERE EXISTS (SELECT 1 FROM unnest(participants) AS p WHERE p ILIKE '%' || ${search} || '%')
      `;
      participantMatchIds = rows.map((r) => r.id);
    }

    const yearNum = year ? Number(year) : undefined;
    const monthNum = month ? Number(month) : undefined;
    let sessionDate: Prisma.DateTimeFilter | undefined;
    if (yearNum) {
      const startYear = monthNum ? monthNum - 1 : 0;
      const monthSpan = monthNum ? 1 : 12;
      const gte = new Date(yearNum, startYear, 1);
      const lt = new Date(yearNum, startYear + monthSpan, 1);
      sessionDate = { gte, lt };
    }

    const where: Prisma.MinuteWhereInput = {
      sessionDate,
      isExtraordinary: type ? type === 'EXTRAORDINARIA' : undefined,
      secretary: secretary ? { contains: secretary, mode: 'insensitive' } : undefined,
      status,
      tags: tag ? { has: tag } : undefined,
      OR: search
        ? [
            { title: { contains: search, mode: 'insensitive' } },
            { secretary: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
            { observations: { contains: search, mode: 'insensitive' } },
            { commitments: { contains: search, mode: 'insensitive' } },
            { keyAgreementsNote: { contains: search, mode: 'insensitive' } },
            { agreements: { some: { OR: [{ description: { contains: search, mode: 'insensitive' } }, { responsible: { contains: search, mode: 'insensitive' } }] } } },
            ...(participantMatchIds?.length ? [{ id: { in: participantMatchIds } }] : []),
          ]
        : undefined,
    };

    return this.prisma.minute.findMany({
      where,
      orderBy: { sessionDate: 'desc' },
      include: { _count: { select: { agreements: true } }, documentUpload: { select: DOCUMENT_UPLOAD_SELECT } },
    });
  }

  async getStats() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const [total, actasThisYear, lastMinute, totalAgreements, pendingCommitments] = await Promise.all([
      this.prisma.minute.count(),
      this.prisma.minute.count({ where: { sessionDate: { gte: startOfYear } } }),
      this.prisma.minute.findFirst({ orderBy: { sessionDate: 'desc' }, select: { id: true, title: true, sessionDate: true } }),
      this.prisma.agreement.count(),
      this.prisma.agreement.count({ where: { state: { in: ['PENDIENTE', 'EN_CURSO'] } } }),
    ]);
    return { total, actasThisYear, lastMinute, totalAgreements, pendingCommitments };
  }

  async findOne(id: string) {
    const minute = await this.prisma.minute.findUnique({
      where: { id },
      include: { agreements: { orderBy: { createdAt: 'asc' } }, documentUpload: { select: DOCUMENT_UPLOAD_SELECT } },
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
    const minute = await this.prisma.minute.findUnique({ where: { id }, select: { documentUploadId: true } });
    if (!minute) throw new NotFoundException('Acta no encontrada');
    await this.prisma.minute.delete({ where: { id } });
    if (minute.documentUploadId) await this.uploads.deleteFile(minute.documentUploadId);
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
