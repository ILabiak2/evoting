import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import {AzureKeyVaultService} from '@/services/azure-key-vault.service'

@Module({
  providers: [BlockchainService, AzureKeyVaultService],
  exports: [BlockchainService],
})
export class BlockchainModule {}