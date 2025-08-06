import { Injectable, UseGuards } from '@nestjs/common';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class ElectionService {
  private readonly logger = new Logger(ElectionService.name);
  
  constructor(
    private readonly blockchain: BlockchainService,
    private prisma: PrismaService,
  ) {}

  create(createElectionDto: CreateElectionDto, userId: string) {
    const { name, voterLimit, startImmediately, candidates, type } =
      createElectionDto;
    return this.blockchain.createElectionWithSignature({
      userId,
      type,
      name,
      startImmediately,
      voterLimit,
      candidateNames: candidates,
    });
  }

  async addElectionMetadata(electionId: number) {
    try {
      const election = await this.blockchain.getElectionMetadata(electionId);
      const {
        name,
        election_address,
        factory_address,
        election_type,
        creator,
      } = election;
      await this.prisma.elections_metadata.create({
        data: {
          name,
          election_address,
          factory_address,
          election_type,
          contract_id: electionId,
          creator,
        },
      });
      this.logger.log(`Election metadata added for election ${electionId}`);
    } catch (error) {
      console.error(error);
    }
  }

  async checkStatus(txHash: string) {
    const status = await this.blockchain.checkElectionCreated(txHash);
    if (status.confirmed) {
      this.addElectionMetadata(status.electionId).catch((err) => {
        this.logger.error('Failed to add election metadata', err);
      });
    }
    return status;
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
