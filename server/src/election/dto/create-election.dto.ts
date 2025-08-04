import {
  MaxLength,
  IsOptional,
  IsString,
  IsIn,
  MinLength,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  Min,
  Max,
  isEnum
} from 'class-validator';
import { ElectionType } from '@/blockchain/types/election-type.enum';

export class CreateElectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsEnum(ElectionType)
  type: ElectionType;

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
