import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { UploadsService } from './uploads.service';

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
        destination: process.env.UPLOADS_DIR ?? './uploads',
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
}
