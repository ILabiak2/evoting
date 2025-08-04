import { Injectable, UseGuards } from '@nestjs/common';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class ElectionService {
  constructor(private readonly blockchain: BlockchainService) {}

  create(createElectionDto: CreateElectionDto, userId: string) {
    const {name, voterLimit, startImmediately, candidates, type} = createElectionDto
    return this.blockchain.createElectionWithSignature({userId, type, name,startImmediately,voterLimit, candidateNames: candidates})
  }

  async checkStatus(txHash: string) {
    return this.blockchain.checkElectionCreated(txHash);
  }

  getUserElections(userId: string) {
    return this.blockchain.getUserElections(userId);
  }

  findAll() {
    return `This action returns all election`;
  }

  getElectionData(id: number) {
    return `This action returns a #${id} election`;
  }
}
