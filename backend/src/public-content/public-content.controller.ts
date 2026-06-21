import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentSection } from '@prisma/client';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.interface';
import { ALLOWED_MIME_TO_EXT, IMAGE_MIME_TO_EXT, MAX_FILE_SIZE_BYTES, UPLOADS_DIR } from '../uploads/uploads.controller';
import { UploadsService } from '../uploads/uploads.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UpdateAboutContentDto } from './dto/about-content.dto';
import { CreateAboutMemberDto, UpdateAboutMemberDto } from './dto/about-member.dto';
import { CreateAboutAxisDto, UpdateAboutAxisDto } from './dto/about-axis.dto';
import { CreateAboutObjectiveDto, UpdateAboutObjectiveDto } from './dto/about-objective.dto';
import { CreateAboutValueDto, UpdateAboutValueDto } from './dto/about-value.dto';
import { CreateAboutDocumentDto, UpdateAboutDocumentDto } from './dto/about-document.dto';
import { PublicContentService, type ContentActor } from './public-content.service';

class SetPublishedDto {
  @IsBoolean()
  isPublished!: boolean;
}

class SetFeaturedDto {
  @IsBoolean()
  isFeatured!: boolean;
}

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsInt()
  sortOrder!: number;
}

class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}

function imageUpload() {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, callback) => {
        const ext = IMAGE_MIME_TO_EXT[file.mimetype];
        if (!ext) {
          callback(new BadRequestException('Tipo de archivo no permitido'), '');
          return;
        }
        callback(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => callback(null, Boolean(IMAGE_MIME_TO_EXT[file.mimetype])),
  });
}

function documentUpload() {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOADS_DIR,
      filename: (_req, file, callback) => {
        const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
        if (!ext) {
          callback(new BadRequestException('Tipo de archivo no permitido'), '');
          return;
        }
        callback(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => callback(null, Boolean(ALLOWED_MIME_TO_EXT[file.mimetype])),
  });
}

@ApiTags('public-content')
@Controller()
export class PublicContentController {
  constructor(
    private readonly service: PublicContentService,
    private readonly uploadsService: UploadsService,
  ) {}

  private actor(user: AuthenticatedUser, req: Request): ContentActor {
    return { userId: user.sub, ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  // ==================== Quiénes Somos — administración ====================
  // OJO: este bloque debe registrarse ANTES que el CMS genérico de abajo.
  // Nest/Express resuelve rutas en orden de declaración: si
  // "admin/public-content/:id" quedara primero, capturaría también
  // "admin/public-content/quienes-somos" tratando "quienes-somos" como :id.

  @Get('admin/public-content/quienes-somos')
  @RequirePermissions('content.manage')
  getAboutContent() {
    return this.service.getAboutContent();
  }

  @Put('admin/public-content/quienes-somos')
  @RequirePermissions('content.manage')
  updateAboutContent(@Body() dto: UpdateAboutContentDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutContent(dto, this.actor(user, req));
  }

  // ---- Integrantes ----

  @Get('admin/public-content/quienes-somos/members')
  @RequirePermissions('content.manage')
  listAboutMembers() {
    return this.service.listAboutMembers();
  }

  @Post('admin/public-content/quienes-somos/members')
  @RequirePermissions('content.manage')
  createAboutMember(@Body() dto: CreateAboutMemberDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.createAboutMember(dto, this.actor(user, req));
  }

  @Patch('admin/public-content/quienes-somos/members/:id')
  @RequirePermissions('content.manage')
  updateAboutMember(@Param('id') id: string, @Body() dto: UpdateAboutMemberDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutMember(id, dto, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/members/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAboutMember(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutMember(id, this.actor(user, req));
  }

  @Post('admin/public-content/quienes-somos/members/:id/photo')
  @RequirePermissions('content.manage')
  @UseInterceptors(imageUpload())
  setAboutMemberPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.setAboutMemberPhoto(id, file, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/members/:id/photo')
  @RequirePermissions('content.manage')
  removeAboutMemberPhoto(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutMemberPhoto(id, this.actor(user, req));
  }

  @Put('admin/public-content/quienes-somos/members/reorder')
  @RequirePermissions('content.manage')
  reorderAboutMembers(@Body() dto: ReorderDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.reorderAboutMembers(dto.items, this.actor(user, req));
  }

  // ---- Ejes de trabajo ----

  @Get('admin/public-content/quienes-somos/axes')
  @RequirePermissions('content.manage')
  listAboutAxes() {
    return this.service.listAboutAxes();
  }

  @Post('admin/public-content/quienes-somos/axes')
  @RequirePermissions('content.manage')
  createAboutAxis(@Body() dto: CreateAboutAxisDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.createAboutAxis(dto, this.actor(user, req));
  }

  @Patch('admin/public-content/quienes-somos/axes/:id')
  @RequirePermissions('content.manage')
  updateAboutAxis(@Param('id') id: string, @Body() dto: UpdateAboutAxisDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutAxis(id, dto, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/axes/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAboutAxis(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutAxis(id, this.actor(user, req));
  }

  @Put('admin/public-content/quienes-somos/axes/reorder')
  @RequirePermissions('content.manage')
  reorderAboutAxes(@Body() dto: ReorderDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.reorderAboutAxes(dto.items, this.actor(user, req));
  }

  // ---- Objetivos ----

  @Get('admin/public-content/quienes-somos/objectives')
  @RequirePermissions('content.manage')
  listAboutObjectives() {
    return this.service.listAboutObjectives();
  }

  @Post('admin/public-content/quienes-somos/objectives')
  @RequirePermissions('content.manage')
  createAboutObjective(@Body() dto: CreateAboutObjectiveDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.createAboutObjective(dto, this.actor(user, req));
  }

  @Patch('admin/public-content/quienes-somos/objectives/:id')
  @RequirePermissions('content.manage')
  updateAboutObjective(@Param('id') id: string, @Body() dto: UpdateAboutObjectiveDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutObjective(id, dto, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/objectives/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAboutObjective(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutObjective(id, this.actor(user, req));
  }

  @Put('admin/public-content/quienes-somos/objectives/reorder')
  @RequirePermissions('content.manage')
  reorderAboutObjectives(@Body() dto: ReorderDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.reorderAboutObjectives(dto.items, this.actor(user, req));
  }

  // ---- Valores ----

  @Get('admin/public-content/quienes-somos/values')
  @RequirePermissions('content.manage')
  listAboutValues() {
    return this.service.listAboutValues();
  }

  @Post('admin/public-content/quienes-somos/values')
  @RequirePermissions('content.manage')
  createAboutValue(@Body() dto: CreateAboutValueDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.createAboutValue(dto, this.actor(user, req));
  }

  @Patch('admin/public-content/quienes-somos/values/:id')
  @RequirePermissions('content.manage')
  updateAboutValue(@Param('id') id: string, @Body() dto: UpdateAboutValueDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutValue(id, dto, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/values/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAboutValue(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutValue(id, this.actor(user, req));
  }

  @Put('admin/public-content/quienes-somos/values/reorder')
  @RequirePermissions('content.manage')
  reorderAboutValues(@Body() dto: ReorderDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.reorderAboutValues(dto.items, this.actor(user, req));
  }

  // ---- Documentos ----

  @Get('admin/public-content/quienes-somos/documents')
  @RequirePermissions('content.manage')
  listAboutDocuments() {
    return this.service.listAboutDocuments();
  }

  @Post('admin/public-content/quienes-somos/documents')
  @RequirePermissions('content.manage')
  @UseInterceptors(documentUpload())
  createAboutDocument(
    @Body() dto: CreateAboutDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.service.createAboutDocument(dto, file, this.actor(user, req));
  }

  @Patch('admin/public-content/quienes-somos/documents/:id')
  @RequirePermissions('content.manage')
  updateAboutDocument(@Param('id') id: string, @Body() dto: UpdateAboutDocumentDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.updateAboutDocument(id, dto, this.actor(user, req));
  }

  @Delete('admin/public-content/quienes-somos/documents/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAboutDocument(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.removeAboutDocument(id, this.actor(user, req));
  }

  @Put('admin/public-content/quienes-somos/documents/reorder')
  @RequirePermissions('content.manage')
  reorderAboutDocuments(@Body() dto: ReorderDto, @CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.reorderAboutDocuments(dto.items, this.actor(user, req));
  }

  // ==================== CMS genérico (existente) ====================

  @Get('admin/public-content')
  @RequirePermissions('content.manage')
  findAllAdmin(@Query('section') section?: ContentSection) {
    return this.service.findAllAdmin(section);
  }

  @Get('admin/public-content/:id')
  @RequirePermissions('content.manage')
  findOneAdmin(@Param('id') id: string) {
    return this.service.findOneAdmin(id);
  }

  @Post('admin/public-content')
  @RequirePermissions('content.manage')
  create(@Body() dto: CreateContentDto) {
    return this.service.create(dto);
  }

  @Patch('admin/public-content/:id')
  @RequirePermissions('content.manage')
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.service.update(id, dto);
  }

  @Delete('admin/public-content/:id')
  @RequirePermissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('admin/public-content/:id/published')
  @RequirePermissions('content.manage')
  setPublished(@Param('id') id: string, @Body() dto: SetPublishedDto) {
    return this.service.setPublished(id, dto.isPublished);
  }

  @Patch('admin/public-content/:id/featured')
  @RequirePermissions('content.manage')
  setFeatured(@Param('id') id: string, @Body() dto: SetFeaturedDto) {
    return this.service.setFeatured(id, dto.isFeatured);
  }

  @Put('admin/public-content/reorder')
  @RequirePermissions('content.manage')
  reorder(@Body() dto: ReorderDto) {
    return this.service.reorder(dto.items);
  }

  // ==================== Portal público ====================

  @Public()
  @Get('public-content')
  findPublished(@Query('section', new ParseEnumPipe(ContentSection)) section: ContentSection) {
    return this.service.findPublished(section);
  }

  @Public()
  @Get('public-content/:slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.service.findPublishedBySlug(slug);
  }

  @Public()
  @Get('public/quienes-somos')
  getPublicAbout() {
    return this.service.getPublicAbout();
  }

  @Public()
  @Get('public/about/members/:id/photo')
  async getPublicMemberPhoto(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.service.getPublicMemberPhotoFile(id);
    res.type(upload.mimeType);
    res.sendFile(this.uploadsService.getFilePath(upload));
  }

  @Public()
  @Get('public/about/documents/:id/file')
  async getPublicDocumentFile(@Param('id') id: string, @Res() res: Response) {
    const upload = await this.service.getPublicDocumentFile(id);
    res.download(this.uploadsService.getFilePath(upload), upload.originalName);
  }
}
