import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IdeaStatus } from '@prisma/client';
import { CreatePublicIdeaDto } from './create-public-idea.dto';

export class UpdateIdeaDto extends PartialType(CreatePublicIdeaDto) {
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  triageNote?: string;
}
