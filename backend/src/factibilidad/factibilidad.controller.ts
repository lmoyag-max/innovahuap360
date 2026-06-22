import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RequireModule } from '../common/decorators/module.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { UploadsService } from '../uploads/uploads.service';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { UpsertCriteriosDto } from './dto/upsert-criterios.dto';
import { UpsertRiesgosDto } from './dto/upsert-riesgos.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';
import { TransitionFichaStatusDto } from './dto/transition-ficha-status.dto';
import { FactibilidadService } from './factibilidad.service';

const EVIDENCIA_MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const MAX_EVIDENCIA_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@ApiTags('factibilidad')
@Controller('factibilidad')
export class FactibilidadController {
  constructor(
    private readonly service: FactibilidadService,
    private readonly uploads: UploadsService,
  ) {}

  @Get('summary')
  @RequirePermissions('projects.read')
  @RequireModule('factibilidad')
  getSummary() {
    return this.service.getSummary();
  }

  @Get('fichas')
  @RequirePermissions('projects.read')
  @RequireModule('factibilidad')
  findAllByProject(@Query('projectId') projectId: string, @Query('includeDeleted') includeDeleted?: string) {
    return this.service.findAllByProject(projectId, includeDeleted === 'true');
  }

  @Get('fichas/:id')
  @RequirePermissions('projects.read')
  @RequireModule('factibilidad')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('fichas')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  create(@Body() dto: CreateFichaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.sub);
  }

  @Patch('fichas/:id')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  update(@Param('id') id: string, @Body() dto: UpdateFichaDto) {
    return this.service.update(id, dto);
  }

  @Patch('fichas/:id/status')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  transitionStatus(@Param('id') id: string, @Body() dto: TransitionFichaStatusDto) {
    return this.service.transitionStatus(id, dto);
  }

  @Delete('fichas/:id')
  @RequirePermissions('factibilidad.delete')
  @RequireModule('factibilidad')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.sub);
  }

  @Post('fichas/:id/restore')
  @RequirePermissions('factibilidad.delete')
  @RequireModule('factibilidad')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.restore(id, user.sub);
  }

  @Put('fichas/:id/criterios')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  setCriteria(@Param('id') id: string, @Body() dto: UpsertCriteriosDto) {
    return this.service.setCriteria(id, dto);
  }

  @Put('fichas/:id/riesgos')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  setRisks(@Param('id') id: string, @Body() dto: UpsertRiesgosDto) {
    return this.service.setRisks(id, dto);
  }

  @Post('fichas/:id/evidencias')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOADS_DIR ?? './uploads',
        filename: (req, file, callback) => {
          const ext = EVIDENCIA_MIME_TO_EXT[file.mimetype];
          if (!ext) {
            callback(new BadRequestException('Tipo de archivo no permitido'), '');
            return;
          }
          callback(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_EVIDENCIA_SIZE_BYTES },
      fileFilter: (req, file, callback) => {
        if (!EVIDENCIA_MIME_TO_EXT[file.mimetype]) {
          callback(new BadRequestException('Tipo de archivo no permitido'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  addEvidencia(
    @Param('id') fichaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.service.addEvidencia(fichaId, file, description, user.sub);
  }

  @Patch('evidencias/:id')
  @RequirePermissions('projects.manage')
  @RequireModule('factibilidad')
  updateEvidencia(@Param('id') id: string, @Body() dto: UpdateEvidenciaDto) {
    return this.service.updateEvidencia(id, dto);
  }

  @Delete('evidencias/:id')
  @RequirePermissions('factibilidad.delete')
  @RequireModule('factibilidad')
  removeEvidencia(@Param('id') id: string) {
    return this.service.removeEvidencia(id);
  }

  // Mismo permiso que la lectura de fichas (projects.read): evita que la
  // descarga quede más abierta que el listado donde se descubre el id de
  // la evidencia. Hoy todos los roles con acceso al módulo ya tienen
  // projects.read, así que esto no cambia el comportamiento de nadie.
  @Get('evidencias/:id/download')
  @RequirePermissions('projects.read')
  @RequireModule('factibilidad')
  async download(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.service.getEvidenciaForDownload(id);
    res.download(this.uploads.getFilePath(upload), upload.originalName);
  }
}
