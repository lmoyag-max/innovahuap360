import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { Response } from 'express';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { UploadsService } from './uploads.service';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? './uploads';

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('uploads')
@Controller('uploads')
@RequirePermissions('uploads.manage')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (req, file, callback) => {
          const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
          if (!ext) {
            callback(new BadRequestException('Tipo de archivo no permitido'), '');
            return;
          }
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
          callback(new BadRequestException('Tipo de archivo no permitido'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.service.register(file, user.sub);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Requiere sesión (guard global) pero ningún permiso adicional: conocer el
  // id (UUID) del recurso ya actúa como capability token para su descarga.
  @Get(':id/download')
  @RequirePermissions()
  async download(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.service.findOne(id);
    const filePath = resolve(UPLOADS_DIR, upload.storedName);
    res.download(filePath, upload.originalName);
  }
}
