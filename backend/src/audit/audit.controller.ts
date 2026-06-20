import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  findAll(@Query('skip') skip?: string, @Query('take') take?: string, @Query('userId') userId?: string) {
    return this.auditService.findAll({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      userId,
    });
  }
}
