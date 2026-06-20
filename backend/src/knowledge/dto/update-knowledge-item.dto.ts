import { PartialType } from '@nestjs/swagger';
import { CreateKnowledgeItemDto } from './create-knowledge-item.dto';

export class UpdateKnowledgeItemDto extends PartialType(CreateKnowledgeItemDto) {}
