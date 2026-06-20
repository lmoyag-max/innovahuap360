import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as never,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  }

  findAll(params: { skip?: number; take?: number; userId?: string }) {
    return this.prisma.auditLog.findMany({
      where: params.userId ? { userId: params.userId } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: params.skip ?? 0,
      take: Math.min(params.take ?? 50, 200),
      include: { user: { select: { fullName: true, email: true } } },
    });
  }
}
