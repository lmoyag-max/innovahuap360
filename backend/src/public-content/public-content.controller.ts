import {
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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentSection } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { PublicContentService } from './public-content.service';

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

@ApiTags('public-content')
@Controller()
export class PublicContentController {
  constructor(private readonly service: PublicContentService) {}

  // ---- Administración ----

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

  // ---- Portal público ----

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
}
