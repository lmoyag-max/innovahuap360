import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RiesgoImpacto, RiesgoProbabilidad } from '@prisma/client';

class RiesgoDto {
  @IsString()
  @MaxLength(500)
  risk!: string;

  @IsEnum(RiesgoProbabilidad)
  probability!: RiesgoProbabilidad;

  @IsEnum(RiesgoImpacto)
  impact!: RiesgoImpacto;

  @IsOptional()
  @IsString()
  mitigation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsible?: string;
}

export class UpsertRiesgosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiesgoDto)
  risks!: RiesgoDto[];
}
