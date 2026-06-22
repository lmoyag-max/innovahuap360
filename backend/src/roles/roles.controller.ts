import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { RolesService } from './roles.service';

class CreateRoleDto {
  @IsString()
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class SetPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds!: string[];
}

class SetModulesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  moduleIds!: string[];
}

@ApiTags('roles')
@Controller('admin/roles')
@RequireModule('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles.manage')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles.manage')
  setPermissions(@Param('id') id: string, @Body() dto: SetPermissionsDto) {
    return this.rolesService.setPermissions(id, dto.permissionIds);
  }

  @Put(':id/modules')
  @RequirePermissions('roles.manage')
  setModules(@Param('id') id: string, @Body() dto: SetModulesDto) {
    return this.rolesService.setModules(id, dto.moduleIds);
  }
}
