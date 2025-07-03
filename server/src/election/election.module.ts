import { Module } from '@nestjs/common';
import { ElectionService } from './election.service';
import { ElectionController } from './election.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  controllers: [ElectionController],
  providers: [ElectionService],
  imports: [BlockchainModule],
})
export class ElectionModule {}
