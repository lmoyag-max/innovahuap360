import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MaxLength } from 'class-validator';

export class CreateFichaDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsDateString()
  evaluationDate!: string;

  @IsString()
  @MaxLength(200)
  responsibleName!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsString()
  evaluationObjective?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  estimatedCosts?: string;

  @IsOptional()
  @IsString()
  requiredResources?: string;

  @IsOptional()
  @IsString()
  licenses?: string;

  @IsOptional()
  @IsString()
  infrastructureCosts?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  manHours?: number;

  @IsOptional()
  @IsString()
  recurringCosts?: string;

  @IsOptional()
  @IsString()
  expectedBenefit?: string;
}
