import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        moduleAccess: { include: { module: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        moduleAccess: { include: { module: true } },
      },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  create(data: { key: string; name: string; description?: string }) {
    return this.prisma.role.create({ data });
  }

  async setPermissions(roleId: string, permissionIds: string[]) {
    await this.findOne(roleId);
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);
    return this.findOne(roleId);
  }

  /** Catálogo de módulos de navegación (capa "Acceso a Módulos"). */
  findAllModules() {
    return this.prisma.module.findMany({
      orderBy: [{ groupKey: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async setModules(roleId: string, moduleIds: string[]) {
    await this.findOne(roleId);
    await this.prisma.$transaction([
      this.prisma.roleModule.deleteMany({ where: { roleId } }),
      this.prisma.roleModule.createMany({
        data: moduleIds.map((moduleId) => ({ roleId, moduleId })),
      }),
    ]);
    return this.findOne(roleId);
  }
}
