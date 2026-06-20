import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateKnowledgeItemDto } from './dto/create-knowledge-item.dto';
import { UpdateKnowledgeItemDto } from './dto/update-knowledge-item.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@Controller()
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Public()
  @Get('public/knowledge')
  findPublic() {
    return this.service.findPublic();
  }

  @Public()
  @Post('public/knowledge/:id/download')
  registerDownload(@Param('id') id: string) {
    return this.service.registerDownload(id);
  }

  @Get('knowledge')
  @RequirePermissions('knowledge.read')
  findAll(@Query('folder') folder?: string) {
    return this.service.findAll(folder);
  }

  @Get('knowledge/:id')
  @RequirePermissions('knowledge.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('knowledge')
  @RequirePermissions('knowledge.manage')
  create(@Body() dto: CreateKnowledgeItemDto) {
    return this.service.create(dto);
  }

  @Patch('knowledge/:id')
  @RequirePermissions('knowledge.manage')
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeItemDto) {
    return this.service.update(id, dto);
  }

  @Delete('knowledge/:id')
  @RequirePermissions('knowledge.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
