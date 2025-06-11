import {
  MaxLength,
  IsOptional,
  IsString,
  IsUrl,
  IsIn,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

const roles = ['user', 'creator'] as const;
export type BranchOperatorRole = typeof roles[number];

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(25)
  name: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsOptional()
  @IsIn(roles)
  role: BranchOperatorRole;
}


export class ChangeUserPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @MinLength(8)
  oldPassword: string;
}
