import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFichaDto } from './create-ficha.dto';

export class UpdateFichaDto extends PartialType(OmitType(CreateFichaDto, ['projectId'] as const)) {}
