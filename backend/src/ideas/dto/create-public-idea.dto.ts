import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePublicIdeaDto {
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  proponentName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  scope?: string;
}
