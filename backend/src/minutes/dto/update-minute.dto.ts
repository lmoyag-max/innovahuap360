import { PartialType } from '@nestjs/swagger';
import { CreateMinuteDto } from './create-minute.dto';

export class UpdateMinuteDto extends PartialType(CreateMinuteDto) {}
