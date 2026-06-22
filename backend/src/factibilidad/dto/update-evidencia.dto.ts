import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEvidenciaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
