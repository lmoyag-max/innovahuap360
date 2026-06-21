import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IdeaPriority, IdeaStatus } from '@prisma/client';

export class UpdateIdeaDto {
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  triageNote?: string;

  @IsOptional()
  @IsEnum(IdeaPriority)
  priority?: IdeaPriority;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
