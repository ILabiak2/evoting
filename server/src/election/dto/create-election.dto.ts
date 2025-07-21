import {
  MaxLength,
  IsOptional,
  IsString,
  IsIn,
  MinLength,
  Matches,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  Max
} from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsBoolean()
  startImmediately: boolean;

  @IsNumber()
  @Min(0)
  @Max(8000000000)
  voterLimit: number;

  @IsArray()
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(25, { each: true })
  candidates: string[];
}
