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
export type BranchOperatorRole = (typeof roles)[number];

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
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  @Matches(/(?=.*[\W_])/, {
    message: 'Password must contain at least one special character',
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

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}

export class ChangeUserPasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/(?=.*[a-z])/, {
    message: 'New password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'New password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'New password must contain at least one number',
  })
  @Matches(/(?=.*[\W_])/, {
    message: 'New password must contain at least one special character',
  })
  newPassword: string;
}
