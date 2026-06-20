import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
  progressPct?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
