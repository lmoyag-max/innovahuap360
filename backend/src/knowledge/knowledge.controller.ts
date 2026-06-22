import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { UploadsService } from '../uploads/uploads.service';
import { CreateKnowledgeItemDto } from './dto/create-knowledge-item.dto';
import { UpdateKnowledgeItemDto } from './dto/update-knowledge-item.dto';
import { KnowledgeService } from './knowledge.service';

@ApiTags('knowledge')
@Controller()
export class KnowledgeController {
  constructor(
    private readonly service: KnowledgeService,
    private readonly uploadsService: UploadsService,
  ) {}

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

  @Public()
  @Get('public/knowledge/:id/file')
  async getPublicFile(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.service.getPublicFile(id);
    res.download(this.uploadsService.getFilePath(upload), upload.originalName);
  }

  @Get('knowledge')
  @RequirePermissions('knowledge.read')
  @RequireModule('knowledge')
  findAll(@Query('folder') folder?: string) {
    return this.service.findAll(folder);
  }

  @Get('knowledge/:id')
  @RequirePermissions('knowledge.read')
  @RequireModule('knowledge')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('knowledge')
  @RequirePermissions('knowledge.manage')
  @RequireModule('knowledge')
  create(@Body() dto: CreateKnowledgeItemDto) {
    return this.service.create(dto);
  }

  @Patch('knowledge/:id')
  @RequirePermissions('knowledge.manage')
  @RequireModule('knowledge')
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeItemDto) {
    return this.service.update(id, dto);
  }

  @Delete('knowledge/:id')
  @RequirePermissions('knowledge.manage')
  @RequireModule('knowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
