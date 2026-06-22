import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const ADMIN_ROLE_KEYS = ['admin', 'super_admin'];

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
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: SAFE_USER_SELECT,
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null }, select: SAFE_USER_SELECT });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /** Uso interno de auth: incluye el hash de contraseña, permisos y módulos habilitados del rol. */
  findByEmailWithAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
            moduleAccess: { include: { module: true } },
          },
        },
      },
    });
  }

  findByIdWithAuth(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
            moduleAccess: { include: { module: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.fullName) data.initials = buildInitials(dto.fullName);
    return this.prisma.user.update({ where: { id }, data, select: SAFE_USER_SELECT });
  }

  /** Evita que un admin se desactive/elimine a sí mismo o deje el sistema sin ningún admin activo. */
  private async assertCanDeactivate(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('No puedes desactivar ni eliminar tu propio usuario');
    }
    const target = await this.prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!target || !ADMIN_ROLE_KEYS.includes(target.role.key)) return;

    const otherActiveAdmins = await this.prisma.user.count({
      where: {
        id: { not: id },
        isActive: true,
        deletedAt: null,
        role: { key: { in: ADMIN_ROLE_KEYS } },
      },
    });
    if (otherActiveAdmins === 0) {
      throw new BadRequestException('No puedes dejar el sistema sin ningún administrador activo');
    }
  }

  async setActive(id: string, isActive: boolean, currentUserId: string) {
    await this.findOne(id);
    if (!isActive) await this.assertCanDeactivate(id, currentUserId);
    return this.prisma.user.update({ where: { id }, data: { isActive }, select: SAFE_USER_SELECT });
  }

  /** Borrado lógico: preserva auditoría/cargas existentes (sin onDelete: Cascade desde
   *  AuditLog/Upload) e impide el login igual que un usuario inactivo (auth.service.ts). */
  async remove(id: string, currentUserId: string) {
    await this.findOne(id);
    await this.assertCanDeactivate(id, currentUserId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: SAFE_USER_SELECT,
    });
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

  /** Suscribe o desuscribe a un usuario de las notificaciones del Comité (Banco de Ideas). */
  async setCommitteeMembership(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.committeeMember.upsert({
      where: { userId: id },
      create: { userId: id, isActive },
      update: { isActive },
    });
  }

  listCommitteeMembers() {
    return this.prisma.committeeMember.findMany({
      where: { isActive: true },
      include: { user: { select: SAFE_USER_SELECT } },
    });
  }
}
