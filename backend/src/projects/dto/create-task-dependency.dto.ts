import { IsString } from 'class-validator';

export class CreateTaskDependencyDto {
  @IsString()
  dependsOnId!: string;
}
