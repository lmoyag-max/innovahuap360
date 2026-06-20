import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { UpdateCommunicationDto } from './dto/update-communication.dto';
import { CommunicationsService } from './communications.service';

@ApiTags('communications')
@Controller('communications')
@RequirePermissions('communications.read')
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('communications.manage')
  create(@Body() dto: CreateCommunicationDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('communications.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCommunicationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('communications.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
