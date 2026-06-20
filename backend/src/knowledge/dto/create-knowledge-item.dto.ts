import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { KnowledgeType } from '@prisma/client';

export class CreateKnowledgeItemDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsEnum(KnowledgeType)
  type!: KnowledgeType;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
