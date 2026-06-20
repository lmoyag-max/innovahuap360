import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  initials: true,
  position: true,
  isActive: true,
  mustChangePass: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, key: true, name: true } },
} as const;

function buildInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '');
  return initials.join('') || 'NA';
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese correo');

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        initials: buildInitials(dto.fullName),
        position: dto.position,
        roleId: dto.roleId,
        isActive: dto.isActive ?? true,
        mustChangePass: true,
      },
      select: SAFE_USER_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({ select: SAFE_USER_SELECT, orderBy: { fullName: 'asc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /** Uso interno de auth: incluye el hash de contraseña y los permisos del rol. */
  findByEmailWithAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  }

  findByIdWithAuth(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.fullName) data.initials = buildInitials(dto.fullName);
    return this.prisma.user.update({ where: { id }, data, select: SAFE_USER_SELECT });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { isActive }, select: SAFE_USER_SELECT });
  }

  async resetPasswordByAdmin(id: string, newPassword: string) {
    await this.findOne(id);
    const passwordHash = await argon2.hash(newPassword);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePass: true },
      select: SAFE_USER_SELECT,
    });
  }

  async updateOwnPassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePass: false },
      select: SAFE_USER_SELECT,
    });
  }

  touchLastLogin(id: string) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
