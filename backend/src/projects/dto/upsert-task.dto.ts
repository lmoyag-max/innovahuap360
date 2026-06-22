import { ProjectTaskPriority, ProjectTaskStatus, ProjectTaskType } from '@prisma/client';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpsertTaskDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  ownerInitials!: string;

  @IsInt()
  @Min(0)
  startOffsetDays!: number;

  @IsInt()
  @Min(1)
  durationDays!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPct?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsIn(Object.values(ProjectTaskType))
  type?: ProjectTaskType;

  @IsOptional()
  @IsIn(Object.values(ProjectTaskStatus))
  status?: ProjectTaskStatus;

  @IsOptional()
  @IsIn(Object.values(ProjectTaskPriority))
  priority?: ProjectTaskPriority;

  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  responsibleName?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
