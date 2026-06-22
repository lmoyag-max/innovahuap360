import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { AskInnovaIaDto } from './dto/ask.dto';
import { InnovaIaService } from './innovaia.service';

@ApiTags('innovaia')
@Controller('innovaia')
@RequirePermissions('innovaia.use')
@RequireModule('innovaia')
export class InnovaIaController {
  constructor(private readonly service: InnovaIaService) {}

  @Get('capabilities')
  getCapabilities() {
    return this.service.getCapabilities();
  }

  @Post('ask')
  ask(@Body() dto: AskInnovaIaDto) {
    return this.service.ask(dto.prompt);
  }
}
