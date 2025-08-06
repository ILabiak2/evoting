import { Module } from '@nestjs/common';
import { ElectionService } from './election.service';
import { ElectionController } from './election.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ElectionController],
  providers: [ElectionService, PrismaService],
  imports: [BlockchainModule],
})
export class ElectionModule {}
