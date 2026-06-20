import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AgreementState } from '@prisma/client';

export class UpsertAgreementDto {
  @IsString()
  @MinLength(3)
  description!: string;

  @IsString()
  responsible!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(AgreementState)
  state?: AgreementState;
}
