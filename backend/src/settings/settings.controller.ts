import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { SettingsService } from './settings.service';

class SetSettingDto {
  @IsDefined()
  value!: unknown;
}

@ApiTags('settings')
@Controller('admin/settings')
@RequirePermissions('settings.manage')
@RequireModule('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put(':key')
  set(@Param('key') key: string, @Body() dto: SetSettingDto) {
    return this.service.set(key, dto.value);
  }
}
