import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStage } from '@prisma/client';

export class TransitionStageDto {
  @IsEnum(ProjectStage)
  stage!: ProjectStage;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
