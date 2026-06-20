import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IdeaStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { CreatePublicIdeaDto } from './dto/create-public-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { IdeasService } from './ideas.service';

@ApiTags('ideas')
@Controller()
export class IdeasController {
  constructor(private readonly service: IdeasService) {}

  // Banco de Ideas — entrada pública, sin sesión. Limitado a 5 envíos/min
  // por IP para evitar spam, igual criterio que las rutas sensibles de auth.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('public/ideas')
  createPublic(@Body() dto: CreatePublicIdeaDto) {
    return this.service.createPublic(dto);
  }

  @Get('ideas')
  @RequirePermissions('ideas.read')
  findAll(@Query('status') status?: IdeaStatus) {
    return this.service.findAll(status);
  }

  @Get('ideas/:id')
  @RequirePermissions('ideas.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('ideas/:id')
  @RequirePermissions('ideas.manage')
  update(@Param('id') id: string, @Body() dto: UpdateIdeaDto) {
    return this.service.update(id, dto);
  }

  @Post('ideas/:id/convert-to-project')
  @RequirePermissions('ideas.manage')
  convertToProject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.convertToProject(id, user.fullName);
  }
}
