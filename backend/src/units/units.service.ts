import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/create-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.unit.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUnitDto) {
    const existing = await this.prisma.unit.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe una unidad o servicio con ese nombre');
    return this.prisma.unit.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateUnitDto) {
    await this.ensureExists(id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async setActive(id: string, isActive: boolean) {
    await this.ensureExists(id);
    return this.prisma.unit.update({ where: { id }, data: { isActive } });
  }

  /**
   * Importa unidades desde un archivo .xlsx (primera columna = nombre,
   * primera fila opcionalmente como encabezado). Evita duplicados por
   * nombre (comparación case-insensitive, espacios normalizados).
   */
  async importFromExcel(buffer: Buffer) {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('El archivo no es un Excel (.xlsx) válido');
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new BadRequestException('El Excel no contiene hojas');

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const existing = await this.prisma.unit.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((u) => u.name.trim().toLowerCase()));

    const toCreate: string[] = [];
    const seenInFile = new Set<string>();

    for (const row of rows) {
      const raw = row?.[0];
      if (typeof raw !== 'string') continue;
      const name = raw.trim();
      if (!name || name.length < 2 || name.length > 160) continue;
      const key = name.toLowerCase();
      if (key === 'nombre' || key === 'unidad' || key === 'servicio' || key === 'unidad o servicio') continue; // encabezado
      if (existingNames.has(key) || seenInFile.has(key)) continue;
      seenInFile.add(key);
      toCreate.push(name);
    }

    if (toCreate.length > 0) {
      await this.prisma.unit.createMany({ data: toCreate.map((name) => ({ name })) });
    }

    return { imported: toCreate.length, skipped: rows.length - toCreate.length };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.unit.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Unidad no encontrada');
  }
}
