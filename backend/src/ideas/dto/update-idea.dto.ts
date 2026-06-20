import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IdeaStatus } from '@prisma/client';

export class UpdateIdeaDto {
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  triageNote?: string;
}
