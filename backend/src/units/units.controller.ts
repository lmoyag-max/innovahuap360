import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IsBoolean } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateUnitDto, UpdateUnitDto } from './dto/create-unit.dto';
import { UnitsService } from './units.service';

class SetUnitActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);
const MAX_EXCEL_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB: la lista de unidades es pequeña

@ApiTags('units')
@Controller()
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  // Listado público para el selector de "Unidad o Servicio" en /postula.
  @Public()
  @Get('public/units')
  findPublic() {
    return this.service.findAll(false);
  }

  @Get('admin/units')
  @RequirePermissions('units.read')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Post('admin/units')
  @RequirePermissions('units.manage')
  create(@Body() dto: CreateUnitDto) {
    return this.service.create(dto);
  }

  @Patch('admin/units/:id')
  @RequirePermissions('units.manage')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.service.update(id, dto);
  }

  @Patch('admin/units/:id/active')
  @RequirePermissions('units.manage')
  setActive(@Param('id') id: string, @Body() dto: SetUnitActiveDto) {
    return this.service.setActive(id, dto.isActive);
  }

  @Post('admin/units/import-excel')
  @RequirePermissions('units.manage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_EXCEL_SIZE_BYTES },
      fileFilter: (req, file, callback) => {
        if (!EXCEL_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException('Solo se permiten archivos .xlsx/.xls'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return this.service.importFromExcel(file.buffer);
  }
}
