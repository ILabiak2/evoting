import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, LoginUserDto } from './dto/user.dto';
import { UUID } from 'crypto';
import { Wallet } from 'ethers';
// import { SecretClient } from '@azure/keyvault-secrets';
// import { ClientSecretCredential } from '@azure/identity';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly azureKeyVaultService: AzureKeyVaultService,
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
        wallets: {
          select: {
            public_address: true,
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
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new UnauthorizedException('Email already registered');

    const password_hash = await bcrypt.hash(createUserDto.password, 10);

    // Create wallet first
    const wallet = Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const publicAddress = wallet.address;
    const userId = uuidv4();
    const vaultKeyName = `wallet-key-${userId}`;

    // Init Azure Key Vault client
    // const credential = new ClientSecretCredential(
    //   process.env.AZURE_TENANT_ID,
    //   process.env.AZURE_CLIENT_ID,
    //   process.env.AZURE_CLIENT_SECRET,
    // );
    // const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`;
    // const vaultClient = new SecretClient(vaultUrl, credential);

    try {
      // Store private key in Key Vault FIRST — before DB write
      // await vaultClient.setSecret(vaultKeyName, privateKey);
      await this.azureKeyVaultService.setPrivateKey(vaultKeyName, privateKey);

      // Wrap all Prisma operations in a single transaction
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
      // Optional: delete secret from Key Vault if DB transaction failed
      console.log(err)
      try {
        // await vaultClient.beginDeleteSecret(vaultKeyName);
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

    // Initialize Azure Key Vault client
    // const credential = new ClientSecretCredential(
    //   process.env.AZURE_TENANT_ID,
    //   process.env.AZURE_CLIENT_ID,
    //   process.env.AZURE_CLIENT_SECRET,
    // );
    // const vaultUrl = `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`;
    // const vaultClient = new SecretClient(vaultUrl, credential);

    try {
      // Save private key in Azure Key Vault
      // await vaultClient.setSecret(vaultKeyName, privateKey);
      await this.azureKeyVaultService.setPrivateKey(vaultKeyName, privateKey);

      // Create user + wallet in a single transaction
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
      // Rollback: delete the key vault secret if DB failed
      try {
        // await vaultClient.beginDeleteSecret(vaultKeyName);
        await this.azureKeyVaultService.deletePrivateKey(vaultKeyName)
      } catch (e) {
        console.error('Vault cleanup failed:', e.message);
      }

      throw new InternalServerErrorException('Google login failed');
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
