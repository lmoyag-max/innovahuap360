import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.setting.findMany();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return (row?.value as T) ?? null;
  }

  set(key: string, value: unknown) {
    return this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as never },
      update: { value: value as never },
    });
  }
}
