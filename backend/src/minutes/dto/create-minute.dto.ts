import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { MinuteStatus } from '@prisma/client';

export class CreateMinuteDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsDateString()
  sessionDate!: string;

  @IsOptional()
  @IsBoolean()
  isExtraordinary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  attendeesCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  attendeeInitials?: string[];

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  secretary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[];

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  keyAgreementsNote?: string;

  @IsOptional()
  @IsString()
  commitments?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(MinuteStatus)
  status?: MinuteStatus;

  @IsOptional()
  @IsUUID()
  documentUploadId?: string;
}
