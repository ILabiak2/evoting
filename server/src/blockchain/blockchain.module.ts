import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import {AzureKeyVaultService} from '@/services/azure-key-vault.service'
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [BlockchainService, AzureKeyVaultService, PrismaService],
  exports: [BlockchainService],
})
export class BlockchainModule {}