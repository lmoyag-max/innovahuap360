import { IsEnum } from 'class-validator';
import { FichaFactibilidadStatus } from '@prisma/client';

export class TransitionFichaStatusDto {
  @IsEnum(FichaFactibilidadStatus)
  status!: FichaFactibilidadStatus;
}
