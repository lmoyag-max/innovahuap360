import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { IdeaStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { CreatePublicIdeaDto } from './dto/create-public-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { IdeasService } from './ideas.service';

const FICHA_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const MAX_FICHA_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('ideas')
@Controller()
export class IdeasController {
  constructor(private readonly service: IdeasService) {}

  // ---- Portal público ----

  @Public()
  @Get('public/ideas/ficha-tecnica/template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.service.getFichaTecnicaTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="Ficha-Tecnica-Innovacion-HUAP.docx"',
    });
    res.send(buffer);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('public/ideas/upload-ficha')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOADS_DIR ?? './uploads',
        filename: (req, file, callback) => {
          const ext = FICHA_MIME_TO_EXT[file.mimetype];
          if (!ext) {
            callback(new BadRequestException('Solo se permiten archivos DOC, DOCX o PDF'), '');
            return;
          }
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FICHA_SIZE_BYTES },
      fileFilter: (req, file, callback) => {
        if (!FICHA_MIME_TO_EXT[file.mimetype]) {
          callback(new BadRequestException('Solo se permiten archivos DOC, DOCX o PDF'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadFicha(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFicha(file);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('public/ideas')
  createPublic(@Body() dto: CreatePublicIdeaDto) {
    return this.service.createPublic(dto);
  }

  // ---- Gestión interna ----

  @Get('ideas/stats')
  @RequirePermissions('ideas.read')
  getStats() {
    return this.service.getStats();
  }

  @Get('ideas')
  @RequirePermissions('ideas.read')
  findAll(
    @Query('status') status?: IdeaStatus,
    @Query('unitId') unitId?: string,
    @Query('search') search?: string,
    @Query('deleted') deleted?: string,
  ) {
    return this.service.findAll({ status, unitId, search, deleted: deleted === 'true' });
  }

  @Get('ideas/:id')
  @RequirePermissions('ideas.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('ideas/:id')
  @RequirePermissions('ideas.manage')
  update(@Param('id') id: string, @Body() dto: UpdateIdeaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, dto, user.fullName);
  }

  @Post('ideas/:id/comments')
  @RequirePermissions('ideas.manage')
  addComment(@Param('id') id: string, @Body() dto: AddCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.addComment(id, dto, user.sub, user.fullName);
  }

  @Post('ideas/:id/convert-to-project')
  @RequirePermissions('ideas.manage')
  convertToProject(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.convertToProject(id, user.fullName);
  }

  @Delete('ideas/:id')
  @RequirePermissions('ideas.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.sub);
  }

  @Post('ideas/:id/restore')
  @RequirePermissions('ideas.delete')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.restore(id, user.sub);
  }
}
