import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

// El cambio de etapa (stage) está excluido: debe pasar siempre por
// PATCH /projects/:id/stage, que valida las reglas de gobernanza del
// pipeline y deja trazabilidad en project_stage_history.
export class UpdateProjectDto extends PartialType(OmitType(CreateProjectDto, ['stage'] as const)) {}
