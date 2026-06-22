import { ArrayMinSize, IsArray, IsEnum, IsInt, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CriterioCategoria } from '@prisma/client';

class CriterioDto {
  @IsEnum(CriterioCategoria)
  categoria!: CriterioCategoria;

  @IsString()
  @MaxLength(200)
  criterionName!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}

export class UpsertCriteriosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterioDto)
  criteria!: CriterioDto[];
}
