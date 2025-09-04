import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { N } from 'ethers';

@Injectable()
export class ElectionService {
  private readonly logger = new Logger(ElectionService.name);

  private generateInviteCode(length = 16): string {
    const bytes = randomBytes(Math.ceil((length * 3) / 4));
    return bytes.toString('base64url').slice(0, length);
  }

  constructor(
    private readonly blockchain: BlockchainService,
    private prisma: PrismaService,
  ) {}

  create(createElectionDto: CreateElectionDto, userId: string) {
    const {
      name,
      voterLimit,
      startImmediately,
      candidates,
      type,
      maxChoicesPerVoter,
    } = createElectionDto;
    return this.blockchain.createElectionWithSignature({
      userId,
      type,
      name,
      startImmediately,
      voterLimit,
      candidateNames: candidates,
      maxChoicesPerVoter,
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

      const exists = await this.prisma.elections_metadata.findFirst({
        where: {
          contract_id: electionId,
          factory_address: factory_address,
        },
        select: { id: true },
      });

      if (exists) {
        this.logger.log(
          `Election metadata already exists for election ${electionId} (id=${exists.id}), skipping create.`,
        );
        return;
      }

      // Create a new metadata row
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
      this.logger.error(error);
    }
  }

  async checkElectionStatus(txHash: string, userId: string) {
    const status = await this.blockchain.checkElectionCreated(txHash);

    if (status.confirmed) {
      void (async () => {
        try {
          await this.addElectionMetadata(status.electionId);
        } catch (err) {
          this.logger.error('Failed to add election metadata', err);
        }

        try {
          await this.blockchain.parseEvents(txHash, userId);
        } catch (err) {
          this.logger.error('Failed to get transaction events', err);
        }
      })();
    }

    return status;
  }

  async checkVoteStatus(txHash: string, userId: string) {
    const status = await this.blockchain.checkUserVoted(txHash);
    if (status.confirmed) {
      this.blockchain.parseEvents(txHash, userId).catch((err) => {
        this.logger.error('Failed to get transaction events', err);
      });
    }
    return status;
  }

  async checkTxStatus(txHash: string, userId: string) {
    const status = await this.blockchain.getTransactionStatus(txHash);
    if (status.confirmed) {
      this.blockchain.parseEvents(txHash, userId).catch((err) => {
        this.logger.error('Failed to get transaction events', err);
      });
    }
    return status;
  }

  getCreatorElections(userId: string) {
    return this.blockchain.getCreatorElections(userId);
  }

  async getUserElections(userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    const links = await this.prisma.user_elections.findMany({
      where: {
        user_id: userId,
        election_meta: { factory_address: process.env.CONTRACT_ADDRESS },
      },
      select: {
        election_meta: {
          select: {
            contract_id: true,
          },
        },
      },
    });

    const ids = links
      .map((l) => l.election_meta?.contract_id)
      .filter((v): v is number => typeof v === 'number');

    if (ids.length === 0) return [];

    return this.blockchain.getElectionByIds(ids);
  }

  async getElectionData(address: string, userId: string) {
    const election = await this.blockchain.getElectionData(address, userId);

    const meta = await this.prisma.elections_metadata.findFirst({
      where: {
        election_address: address,
        factory_address: process.env.CONTRACT_ADDRESS,
      },
      select: { id: true },
    });

    let isParticipant = false;
    if (meta && userId) {
      const membership = await this.prisma.user_elections.findUnique({
        where: {
          user_id_election_id: {
            user_id: userId,
            election_id: meta.id,
          },
        },
        select: { id: true },
      });
      isParticipant = !!membership;
    }

    return {
      ...election,
      isParticipant,
    };
  }

  async generateInvites(
    electionAddress: string,
    quantity: number,
    userId: string,
  ) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) {
      throw new BadRequestException('Quantity must be between 1 and 200');
    }

    const election = await this.prisma.elections_metadata.findUnique({
      where: {
        election_address: electionAddress,
        factory_address: process.env.CONTRACT_ADDRESS,
      },
      select: { id: true, election_type: true, creator: true },
    });
    if (!election) throw new NotFoundException('Election not found');
    if (!election.election_type.startsWith('private')) {
      throw new BadRequestException(
        'Invites can only be generated for private elections',
      );
    }

    const requester = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, wallets: { select: { public_address: true } } },
    });
    if (!requester) throw new NotFoundException('User not found');

    const creatorStr = election.creator?.toString() || '';
    const isCreatorByWallet = requester.wallets.some(
      (w) =>
        w.public_address &&
        w.public_address.toLowerCase() === creatorStr.toLowerCase(),
    );
    if (!isCreatorByWallet) {
      throw new ForbiddenException(
        'Only the election creator can generate invites',
      );
    }

    const target = Math.max(1, Math.min(quantity, 200));
    const created: string[] = [];

    while (created.length < target) {
      const remaining = target - created.length;

      // 1) generate exactly how many you still need, dedupe in-memory
      const candidateSet = new Set<string>();
      while (candidateSet.size < remaining) {
        candidateSet.add(this.generateInviteCode(16));
      }
      const candidates = Array.from(candidateSet);

      // 2) filter out any that already exist (global uniqueness on `code`)
      const existing = await this.prisma.invites.findMany({
        where: { code: { in: candidates } },
        select: { code: true },
      });
      const existingSet = new Set(existing.map((x) => x.code));
      const toInsert = candidates.filter((c) => !existingSet.has(c));

      if (toInsert.length === 0) {
        continue;
      }

      await this.prisma.invites.createMany({
        data: toInsert.map((code) => ({
          code,
          election_id: election.id,
        })),
        skipDuplicates: true,
      });

      const nowExisting = await this.prisma.invites.findMany({
        where: { code: { in: toInsert }, election_id: election.id },
        select: { code: true },
      });

      for (const { code } of nowExisting) {
        if (created.length < target && !created.includes(code)) {
          created.push(code);
        }
      }
    }

    return { codes: created };
  }

  async joinPublicElection(electionAddress: string, userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    const meta = await this.prisma.elections_metadata.findFirst({
      where: {
        election_address: electionAddress,
        factory_address: process.env.CONTRACT_ADDRESS,
      },
      select: { id: true, election_type: true },
    });
    if (!meta) throw new NotFoundException('Election not found');
    if (!meta.election_type.includes('public')) {
      throw new ForbiddenException('This election requires an invite code');
    }

    try {
      await this.prisma.user_elections.create({
        data: { user_id: userId, election_id: meta.id },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return { joined: true };
      }
      throw new BadRequestException(
        'Error while joining election: ' + e?.message,
      );
    }
    return { joined: true };
  }

  async leavePublicElection(electionAddress: string, userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    const meta = await this.prisma.elections_metadata.findFirst({
      where: {
        election_address: electionAddress,
        factory_address: process.env.CONTRACT_ADDRESS,
      },
      select: { id: true, election_type: true },
    });
    if (!meta) return { left: true };

    const typeStr = String(meta.election_type);
    if (!typeStr.includes('public')) {
      throw new ForbiddenException(
        'Leaving is only supported for public elections',
      );
    }
    try {
      await this.prisma.user_elections.delete({
        where: {
          user_id_election_id: {
            user_id: userId,
            election_id: meta.id,
          },
        },
      });
    } catch (e: any) {
      // P2025 = record not found (user wasn't a participant)
      if (e?.code !== 'P2025') {
        throw new BadRequestException(
          'Error while leaving election: ' + e?.message,
        );
      }
    }

    return { left: true };
  }

  async joinPrivateElection(code: string, userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    const invite = await this.prisma.invites.findFirst({
      where: { code, is_expired: false },
      select: { id: true, is_used: true, election_id: true },
    });
    if (!invite) throw new NotFoundException('Wrong invite code');
    if (invite.is_used)
      throw new ForbiddenException('Invite code was already used');

    await this.prisma.$transaction(async (tx) => {
      await tx.invites.update({
        where: { id: invite.id },
        data: { is_used: true, used_by_id: userId, used_at: new Date() },
      });

      try {
        await tx.user_elections.create({
          data: { user_id: userId, election_id: invite.election_id },
        });
      } catch (e: any) {
        if (e?.code !== 'P2002') return { joined: true };
        throw new BadRequestException(
          'Error while joining election: ' + e?.message,
        );
      }
    });

    return { joined: true };
  }

  async voteInElectionWithSignature(
    dto: {
      electionAddress: string;
      candidateId?: number;
      candidateIds?: number[];
    },
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Missing user');

    const { electionAddress, candidateId, candidateIds } = dto;
    if (!electionAddress) {
      throw new BadRequestException('electionAddress is required');
    }

    try {
      const { txHash } = await this.blockchain.voteInElectionWithSignature({
        userId,
        electionAddress,
        candidateId,
        candidateIds,
      });
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(`${msg}`);
    }
  }

  async startElection(electionAddress: string, userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.startElection(
        electionAddress,
        userId,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  async stopElection(electionAddress: string, userId: string) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.stopElection(
        electionAddress,
        userId,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  async editElectionName(
    electionAddress: string,
    newName: string,
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.editElectionName(
        electionAddress,
        userId,
        newName,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  async editCandidate(
    electionAddress: string,
    candidateId: number,
    newName: string,
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.editCandidate(
        electionAddress,
        candidateId,
        newName,
        userId,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  async addCandidates(
    electionAddress: string,
    candidateNames: string[],
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.addCandidates(
        electionAddress,
        candidateNames,
        userId,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }

  async removeCandidate(
    electionAddress: string,
    candidateId: number,
    userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Missing user');

    try {
      const { txHash } = await this.blockchain.removeCandidate(
        electionAddress,
        candidateId,
        userId,
      );
      return { txHash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      throw new BadRequestException(msg);
    }
  }
}
