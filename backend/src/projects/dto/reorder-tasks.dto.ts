import { IsArray, IsString } from 'class-validator';

export class ReorderTasksDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
