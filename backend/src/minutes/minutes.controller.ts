import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MinuteStatus } from '@prisma/client';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CreateMinuteDto } from './dto/create-minute.dto';
import { UpdateMinuteDto } from './dto/update-minute.dto';
import { UpsertAgreementDto } from './dto/upsert-agreement.dto';
import { MinutesService } from './minutes.service';

@ApiTags('minutes')
@Controller('minutes')
@RequirePermissions('minutes.read')
@RequireModule('minutes')
export class MinutesController {
  constructor(private readonly service: MinutesService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('type') type?: 'ORDINARIA' | 'EXTRAORDINARIA',
    @Query('secretary') secretary?: string,
    @Query('status') status?: MinuteStatus,
    @Query('tag') tag?: string,
  ) {
    return this.service.findAll({ search, year, month, type, secretary, status, tag });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('minutes.manage')
  create(@Body() dto: CreateMinuteDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('minutes.manage')
  update(@Param('id') id: string, @Body() dto: UpdateMinuteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('minutes.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/agreements')
  @RequirePermissions('minutes.manage')
  addAgreement(@Param('id') id: string, @Body() dto: UpsertAgreementDto) {
    return this.service.addAgreement(id, dto);
  }

  @Patch(':id/agreements/:agreementId')
  @RequirePermissions('minutes.manage')
  updateAgreement(
    @Param('id') id: string,
    @Param('agreementId') agreementId: string,
    @Body() dto: UpsertAgreementDto,
  ) {
    return this.service.updateAgreement(id, agreementId, dto);
  }

  @Delete(':id/agreements/:agreementId')
  @RequirePermissions('minutes.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAgreement(@Param('id') id: string, @Param('agreementId') agreementId: string) {
    return this.service.removeAgreement(id, agreementId);
  }
}
