import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  LoginUserDto,
  ChangeUserPasswordDto,
} from './dto/user.dto';
import { UUID } from 'crypto';
import { Wallet } from 'ethers';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly azureKeyVaultService: AzureKeyVaultService,
  ) {}

  private static passwordChangeAttempts: Map<
    string,
    { count: number; firstAttemptTs: number }
  > = new Map();
  private static readonly PASSWORD_CHANGE_MAX_ATTEMPTS = 5;
  private static readonly PASSWORD_CHANGE_WINDOW_MS = 15 * 60 * 1000;

  async getUserData(userId: UUID) {
    const userData = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar_url: true,
        created_at: true,
        wallets: {
          select: {
            public_address: true,
          },
        },
        auth_providers: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!userData) throw new UnauthorizedException('No user');
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar_url: userData.avatar_url,
      public_address: userData.wallets[0]?.public_address ?? null,
      provider: userData.auth_providers[0]?.provider ?? null,
      created_at: userData.created_at,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new UnauthorizedException('Email already registered');

    const pwd = createUserDto.password || '';
    const pwdErrors: string[] = [];
    if (pwd.length < 8)
      pwdErrors.push('Password must be at least 8 characters long');
    if (!/[a-z]/.test(pwd))
      pwdErrors.push('Password must contain a lowercase letter');
    if (!/[A-Z]/.test(pwd))
      pwdErrors.push('Password must contain an uppercase letter');
    if (!/[0-9]/.test(pwd)) pwdErrors.push('Password must contain a number');
    if (!/[!@#\$%\^&\*\(\)\-_=+\[\]{};:\"\\|,.<>\/?]/.test(pwd))
      pwdErrors.push('Password must contain a special character');

    if (pwdErrors.length) {
      throw new BadRequestException({
        message: 'Password does not meet strength requirements',
        details: pwdErrors,
      });
    }

    const password_hash = await bcrypt.hash(pwd, 10);

    // Create wallet first
    const wallet = Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicAddress = wallet.address;
    const userId = uuidv4();
    const vaultKeyName = `wallet-key-${userId}`;

    try {
      await this.azureKeyVaultService.setPrivateKey(vaultKeyName, privateKey);

      const [user] = await this.prisma.$transaction([
        this.prisma.users.create({
          data: {
            id: userId,
            email: createUserDto.email,
            name: createUserDto.name,
            role: createUserDto.role === 'creator' ? 'creator' : 'user',
            auth_providers: {
              create: {
                provider: 'email',
                provider_user_id: createUserDto.email,
                password_hash,
              },
            },
          },
        }),
        this.prisma.wallets.create({
          data: {
            public_address: publicAddress,
            vault_key_name: vaultKeyName,
            user_id: userId,
          },
        }),
      ]);

      return this._generateToken(user);
    } catch (err) {
      console.log(err);
      try {
        await this.azureKeyVaultService.deletePrivateKey(vaultKeyName);
      } catch (e) {
        console.error('Failed to cleanup key vault secret:', e.message);
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const provider = await this.prisma.auth_providers.findFirst({
      where: { provider: 'email', provider_user_id: loginUserDto.email },
      include: { users: true },
    });

    if (!provider || !provider.password_hash)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(
      loginUserDto.password,
      provider.password_hash,
    );
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this._generateToken(provider.users);
  }

  async validateOAuthLogin(profile: any) {
    const { id, emails, displayName, photos } = profile;

    // Check if user already exists
    const existing = await this.prisma.auth_providers.findFirst({
      where: {
        provider: 'google',
        provider_user_id: id,
      },
      include: { users: true },
    });

    if (existing) {
      return this._generateToken(existing.users);
    }

    // Create wallet
    const wallet = Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicAddress = wallet.address;
    const userId = uuidv4();
    const vaultKeyName = `wallet-key-${userId}`;

    try {
      await this.azureKeyVaultService.setPrivateKey(vaultKeyName, privateKey);

      const [newUser] = await this.prisma.$transaction([
        this.prisma.users.create({
          data: {
            id: userId,
            email: emails[0].value,
            name: displayName,
            avatar_url: photos?.[0]?.value,
            auth_providers: {
              create: {
                provider: 'google',
                provider_user_id: id,
              },
            },
          },
        }),
        this.prisma.wallets.create({
          data: {
            public_address: publicAddress,
            vault_key_name: vaultKeyName,
            user_id: userId,
          },
        }),
      ]);

      return this._generateToken(newUser);
    } catch (err) {
      // Rollback
      try {
        await this.azureKeyVaultService.deletePrivateKey(vaultKeyName);
      } catch (e) {
        console.error('Vault cleanup failed:', e.message);
      }

      throw new InternalServerErrorException('Google login failed');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangeUserPasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new passwords are required');
    }

    const key = String(userId);
    const now = Date.now();
    const entry = AuthService.passwordChangeAttempts.get(key);
    if (entry) {
      if (now - entry.firstAttemptTs > AuthService.PASSWORD_CHANGE_WINDOW_MS) {
        AuthService.passwordChangeAttempts.set(key, {
          count: 1,
          firstAttemptTs: now,
        });
      } else {
        if (entry.count >= AuthService.PASSWORD_CHANGE_MAX_ATTEMPTS) {
          throw new HttpException(
            'Too many password change attempts. Try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        entry.count++;
        AuthService.passwordChangeAttempts.set(key, entry);
      }
    } else {
      AuthService.passwordChangeAttempts.set(key, {
        count: 1,
        firstAttemptTs: now,
      });
    }

    const provider = await this.prisma.auth_providers.findFirst({
      where: { user_id: userId, provider: 'email' },
    });

    if (!provider || !provider.password_hash) {
      throw new ForbiddenException(
        'Account does not use email/password authentication',
      );
    }

    const matches = await bcrypt.compare(
      currentPassword,
      provider.password_hash,
    );
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const errors: string[] = [];
    if (newPassword.length < 8)
      errors.push('Password must be at least 8 characters long');
    if (!/[a-z]/.test(newPassword))
      errors.push('Password must contain a lowercase letter');
    if (!/[A-Z]/.test(newPassword))
      errors.push('Password must contain an uppercase letter');
    if (!/[0-9]/.test(newPassword))
      errors.push('Password must contain a number');
    if (!/[!@#\$%\^&\*\(\)\-_=+\[\]{};:\"\\|,.<>\/?]/.test(newPassword))
      errors.push('Password must contain a special character');
    if (newPassword === currentPassword)
      errors.push('New password must be different from current password');

    if (errors.length) {
      throw new BadRequestException({
        message: 'Password does not meet strength requirements',
        details: errors,
      });
    }

    try {
      const newHash = await bcrypt.hash(newPassword, 10);
      await this.prisma.auth_providers.update({
        where: { id: provider.id },
        data: { password_hash: newHash },
      });

      AuthService.passwordChangeAttempts.delete(key);

      return { changed: true };
    } catch (err) {
      console.error('Failed to update password', err);
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  private _generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15d' });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
