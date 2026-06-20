import { ArrayMinSize, IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FeasibilityCriterionDto {
  @IsString()
  criterionName!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}

export class SetFeasibilityDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeasibilityCriterionDto)
  criteria!: FeasibilityCriterionDto[];
}
