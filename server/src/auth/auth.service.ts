import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, LoginUserDto } from './dto/user.dto';
import { UUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async getUserData(userId: UUID) {
    const userData = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar_url: true,
      }
    });

    if (!userData) throw new UnauthorizedException('No user');
    return userData;
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new UnauthorizedException('Email already registered');

    const password_hash = await bcrypt.hash(createUserDto.password, 10);

    const signupData = {
      email: createUserDto.email,
      name: createUserDto.name,
      role: createUserDto.role == 'creator' ? 'creator' : 'user',
      auth_providers: {
        create: {
          provider: 'email',
          provider_user_id: createUserDto.email,
          password_hash,
        },
      },
    };

    const user = await this.prisma.users.create({
      data: signupData,
    });

    return this._generateToken(user);
  }

  async login(loginUserDto: LoginUserDto) {
    const provider = await this.prisma.auth_providers.findFirst({
      where: { provider: 'email', provider_user_id: loginUserDto.email },
      include: { users: true },
    });

    if (!provider || !provider.password_hash)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(loginUserDto.password, provider.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this._generateToken(provider.users);
  }

  async validateOAuthLogin(profile: any) {
    const { id, emails, displayName, photos } = profile;

    let user = await this.prisma.auth_providers.findFirst({
      where: {
        provider: 'google',
        provider_user_id: id,
      },
      include: { users: true },
    });

    if (!user) {
      const newUser = await this.prisma.users.create({
        data: {
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
      });

      return this._generateToken(newUser);
    }

    return this._generateToken(user.users);
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
