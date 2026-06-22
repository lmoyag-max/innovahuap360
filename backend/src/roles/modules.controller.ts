import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RolesService } from './roles.service';

/** Catálogo de módulos de navegación para la capa "Acceso a Módulos" (Roles → Acceso a Módulos). */
@ApiTags('modules')
@Controller('admin/modules')
export class ModulesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  findAll() {
    return this.rolesService.findAllModules();
  }
}
