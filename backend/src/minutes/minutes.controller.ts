import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateMinuteDto } from './dto/create-minute.dto';
import { UpdateMinuteDto } from './dto/update-minute.dto';
import { UpsertAgreementDto } from './dto/upsert-agreement.dto';
import { MinutesService } from './minutes.service';

@ApiTags('minutes')
@Controller('minutes')
@RequirePermissions('minutes.read')
export class MinutesController {
  constructor(private readonly service: MinutesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
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
