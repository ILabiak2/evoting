import { IsInt, Max, Min } from 'class-validator';

export class GenerateInvitesDto {
  @IsInt()
  @Min(1)
  @Max(200)
  quantity: number;
}