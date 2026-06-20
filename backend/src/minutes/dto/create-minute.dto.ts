import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateMinuteDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsDateString()
  sessionDate!: string;

  @IsOptional()
  @IsBoolean()
  isExtraordinary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  attendeesCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  attendeeInitials?: string[];

  @IsOptional()
  @IsString()
  documentUrl?: string;
}
