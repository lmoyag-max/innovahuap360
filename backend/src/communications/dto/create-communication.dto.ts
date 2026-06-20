import { IsDateString, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { CommunicationStatus } from '@prisma/client';

export class CreateCommunicationDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsEnum(CommunicationStatus)
  status?: CommunicationStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>;
}
