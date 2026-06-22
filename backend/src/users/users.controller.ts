import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString, MinLength } from 'class-validator';
import type { Request } from 'express';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@ApiTags('users')
@Controller('admin/users')
@RequireModule('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  @Get()
  @RequirePermissions('users.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users.manage')
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: AuthenticatedUser, @Req() req: Request) {
    const created = await this.usersService.create(dto);
    await this.auditService.log({
      userId: currentUser.sub,
      action: 'users.create',
      entityType: 'User',
      entityId: created.id,
      ...this.meta(req),
    });
    return created;
  }

  @Patch(':id')
  @RequirePermissions('users.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const updated = await this.usersService.update(id, dto);
    await this.auditService.log({
      userId: currentUser.sub,
      action: 'users.update',
      entityType: 'User',
      entityId: id,
      ...this.meta(req),
    });
    return updated;
  }

  @Patch(':id/active')
  @RequirePermissions('users.manage')
  async setActive(
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const updated = await this.usersService.setActive(id, dto.isActive, currentUser.sub);
    await this.auditService.log({
      userId: currentUser.sub,
      action: 'users.set_active',
      entityType: 'User',
      entityId: id,
      metadata: { isActive: dto.isActive },
      ...this.meta(req),
    });
    return updated;
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser, @Req() req: Request) {
    const removed = await this.usersService.remove(id, currentUser.sub);
    await this.auditService.log({
      userId: currentUser.sub,
      action: 'users.delete',
      entityType: 'User',
      entityId: id,
      ...this.meta(req),
    });
    return removed;
  }

  @Patch(':id/reset-password')
  @RequirePermissions('users.manage')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPasswordByAdmin(id, dto.newPassword);
  }

  @Get('committee-members/list')
  @RequirePermissions('users.read')
  listCommitteeMembers() {
    return this.usersService.listCommitteeMembers();
  }

  @Patch(':id/committee-membership')
  @RequirePermissions('users.manage')
  setCommitteeMembership(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.usersService.setCommitteeMembership(id, dto.isActive);
  }
}
