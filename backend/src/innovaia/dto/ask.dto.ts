import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskInnovaIaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  prompt!: string;
}
