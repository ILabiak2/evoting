import { Injectable } from '@nestjs/common';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class ElectionService {
  constructor(private readonly blockchain: BlockchainService) {}

  create(createElectionDto: CreateElectionDto) {
    return 'This action adds a new election';
  }

  getData() {
    return this.blockchain.getSomething();
  }

  findAll() {
    return `This action returns all election`;
  }

  getElectionData(id: number) {
    return `This action returns a #${id} election`;
  }
}
