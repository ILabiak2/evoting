import {
  MaxLength,
  IsOptional,
  IsString,
  IsIn,
  MinLength,
  Matches,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsBoolean()
  startedManually: boolean;

  @IsArray()
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(25, { each: true })
  candidates: string[];
}
