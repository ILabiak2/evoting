import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { VotingFactory } from './_types/VotingFactory';
import * as VotingFactoryABI from './_abi/VotingFactory.json';
import * as PublicSingleElectionAbi from './_abi/PublicElection.json';
import { VOTE_REGISTRY } from './types/vote-schemas';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';
import { CreateElectionParams } from './types/election.interface';
import {
  ElectionType,
  ElectionTypeFromNumber,
} from './types/election-type.enum';
import { PrismaService } from '@/prisma/prisma.service';
import { mergeEventOnlyAbi, decodeTxWithUnionAbi } from './events-helper';

declare global {
  interface BigInt {
    toJSON(): Number;
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this);
};

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: VotingFactory;
  private adminWallet: ethers.Wallet;
  private unionAbi;
  // private contractWithSigner: ethers.Contract;

  constructor(
    private readonly azureKeyVaultService: AzureKeyVaultService,
    private readonly prisma: PrismaService,
  ) {
    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(
      process.env.CREATOR_PRIVATE_KEY,
      this.provider,
    );

    this.contract = new ethers.Contract(
      contractAddress,
      VotingFactoryABI as any,
      this.provider,
    ) as unknown as VotingFactory;

    this.unionAbi = mergeEventOnlyAbi([
      VotingFactoryABI,
      PublicSingleElectionAbi,
    ]);
  }

  formatElectionData(election: any) {
    const { coreData, electionType, contractAddress } = election;

    const {
      id,
      name,
      createdAt,
      startTime,
      endTime,
      creator,
      isActive,
      started,
      ended,
      candidateCount,
      voterLimit,
      candidates: candidatesRaw,
    } = coreData;

    const candidates = candidatesRaw.map((candidate: any) => ({
      id: candidate.id,
      name: candidate.name,
      votes: Number(candidate.voteCount),
    }));

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

    return {
      id,
      name,
      createdAt,
      startTime: Number(startTime),
      endTime: Number(endTime),
      creator,
      isActive,
      started,
      ended,
      candidateCount: Number(candidateCount),
      voterLimit: Number(voterLimit),
      electionType: ElectionTypeFromNumber[Number(electionType)],
      contractAddress,
      candidates,
      totalVotes,
    };
  }

  async getDomain() {
    const network = await this.provider.getNetwork();

    return {
      name: 'VotingFactory',
      version: '1',
      chainId: network.chainId,
      verifyingContract: await this.contract.target.toString(),
    };
  }

  async getUserWallet(userId: string) {
    const vaultKeyName = `wallet-key-${userId}`;
    const privateKey =
      await this.azureKeyVaultService.getPrivateKey(vaultKeyName);
    return new ethers.Wallet(privateKey, this.provider);
  }

  async getSigner(userId: string) {
    const userWallet = await this.getUserWallet(userId);
    return this.contract.connect(userWallet);
  }

  async createElectionWithSignature(params: CreateElectionParams) {
    const {
      userId,
      type,
      name,
      startImmediately,
      voterLimit = 0,
      candidateNames,
    } = params;
    const userWallet = await this.getUserWallet(userId);
    const contractWithAdminSigner = this.contract.connect(this.adminWallet);
    const domain = await this.getDomain();

    const types = {
      Election: [
        { name: 'name', type: 'string' },
        { name: 'startImmediately', type: 'bool' },
        { name: 'voterLimit', type: 'uint256' },
        { name: 'creator', type: 'address' },
      ],
    };

    const value = {
      name,
      startImmediately,
      voterLimit,
      creator: userWallet.address,
    };

    const signature = await userWallet.signTypedData(domain, types, value);

    switch (type) {
      case ElectionType.PUBLIC_SINGLE_CHOICE:
        try {
          const tx =
            await contractWithAdminSigner.createPublicElectionWithSignature(
              name,
              startImmediately,
              voterLimit,
              userWallet.address,
              candidateNames,
              signature,
            );

          return { txHash: tx.hash };
        } catch (error) {
          console.error('Election creation failed:', error);
          throw new Error('Failed to create election on-chain');
        }
      case ElectionType.PRIVATE_SINGLE_CHOICE:
        try {
          const tx =
            await contractWithAdminSigner.createPrivateElectionWithSignature(
              name,
              startImmediately,
              voterLimit,
              userWallet.address,
              candidateNames,
              signature,
            );

          return { txHash: tx.hash };
        } catch (error) {
          console.error('Election creation failed:', error);
          throw new Error('Failed to create election on-chain');
        }
    }
  }

  private async getConfirmedReceipt(
    txHash: string,
  ): Promise<ethers.TransactionReceipt | null> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt || (await receipt.confirmations()) === 0) {
      return null;
    }
    return receipt;
  }

  async getTransactionStatus(txHash: string) {
    const receipt = await this.getConfirmedReceipt(txHash);
    return { confirmed: !!receipt };
  }

  async parseEvents(txHash: string, userId: string) {
    const events = await decodeTxWithUnionAbi({
      provider: this.provider,
      unionAbi: this.unionAbi,
      txHash,
    });

    for (let event of events) {
      if (!event.parsed) continue;
      let description = '';
      // console.log(event);
      const { name, candidates, id } = await this.getElectionData(
        event.args.contractAddress || event.address,
        userId,
      );
      switch (event.event) {
        case 'VoteCast':
          description = `Casted vote to candidate ${candidates[event.args.candidateId]?.name} in election ${name}`;
          break;
        case 'CandidateAdded': //need to test after updating smart contract code
          description = `Added candidate ${event.args.name} to election ${name}`;
          break;
        case 'CandidateRemoved':
          description = `Removed candidate ${event.args.name} from election ${name}`;
          break;
        case 'CandidateRenamed':
          description = `Renamed candidate from ${event.args.oldName} to ${event.args.newName} in election ${name}`;
          break;
        case 'ElectionStarted':
          description = `Election ${name} started`;
          break;
        case 'ElectionEnded':
          description = `Election ${name} ended`;
          break;
        case 'ElectionCreated':
          description = `Election ${name} created`;
          break;
        default:
          console.log('Unknown event: ' + event.event);
          continue;
      }
      const dbEvent = await this.prisma.events.findFirst({
        where: {
          tx_hash: txHash,
          factory_address: process.env.CONTRACT_ADDRESS
        },
      });
      if (dbEvent) continue;
      const meta = await this.prisma.elections_metadata.findFirst({
        where: {
          election_address: event.args.contractAddress || event.address,
        },
      });
      if (!meta) {
        console.log('Could not find election metadata');
      }
      await this.prisma.events.create({
        data: {
          user_id: userId,
          tx_hash: txHash,
          description,
          election_id: meta.id,
          factory_address: process.env.CONTRACT_ADDRESS,
          time: new Date(event.timestamp * 1000),
        },
      });
      console.log('Event added');
    }
  }

  async checkUserVoted(txHash: string): Promise<{
    confirmed: boolean;
    electionId?: number;
    candidateId?: number;
    candidateIds?: number[];
    voter?: string;
  }> {
    const voteCastSig1 = 'VoteCast(uint256,uint256,address)';
    // const voteCastSig2 = "VoteCast(uint256,uint256[],address)";
    const topic0Single = ethers.id(voteCastSig1);
    // const topic0Multi  = ethers.id(voteCastSig2);

    const receipt = await this.getConfirmedReceipt(txHash);
    if (!receipt) {
      return { confirmed: false };
    }

    const logs = receipt.logs.filter((log) => log.topics[0] === topic0Single);
    if (!logs.length) return { confirmed: false };

    const log = logs[0];
    const abiCoder = new ethers.AbiCoder();

    const electionId = Number(ethers.getBigInt(log.topics[1]));

    const [candidateId, voter] = abiCoder.decode(
      ['uint256', 'address'],
      log.data,
    );
    return {
      confirmed: true,
      electionId,
      candidateId: Number(candidateId),
      voter,
    };
  }

  async checkElectionCreated(txHash: string): Promise<{
    confirmed: boolean;
    electionId?: number;
    contractAddress?: string;
  }> {
    const receipt = await this.getConfirmedReceipt(txHash);
    if (!receipt) {
      return { confirmed: false };
    }

    const events = await this.contract.queryFilter(
      this.contract.filters.ElectionCreated(),
      receipt.blockNumber,
      receipt.blockNumber,
    );
    const event = events.find((e) => e.transactionHash === txHash);
    if (!event) return { confirmed: false };

    const electionId = Number(event.args?.id);
    const election = await this.contract.getElection(electionId);
    const contractAddress =
      election?.contractAddress?.toString?.() ?? election?.contractAddress;

    return {
      confirmed: true,
      electionId,
      contractAddress,
    };
  }

  async getCreatorElections(userId: string) {
    const contractWithSigner = await this.getSigner(userId);
    const electionsRaw = await contractWithSigner.getMyElections();
    const elections = electionsRaw.map((election: any) =>
      this.formatElectionData(election),
    );

    return elections;
  }

  async getElectionByIds(ids: number[]) {
    try {
      const elections = await this.contract.getElectionsByIds(ids);
      if (!elections[0]) return [];
      const result = elections.map((el) => this.formatElectionData(el));
      return result;
    } catch (error) {
      throw new NotFoundException(
        'Failed to get elections by ids: ' + error.shortMessage,
      );
    }
  }

  async getElectionMetadata(electionId: number) {
    const election = await this.contract.getElection(electionId);
    const { name, creator } = election.coreData;
    const electionTypeIndex = Number(election.electionType);
    return {
      name: name,
      election_address: election.contractAddress,
      factory_address: process.env.CONTRACT_ADDRESS,
      election_type: ElectionTypeFromNumber[electionTypeIndex],
      creator: creator,
    };
  }

  async getElectionData(address: string, userId: string) {
    try {
      const contractWithSigner = await this.getSigner(userId);
      const election = await contractWithSigner.getElectionByAddress(address);
      const { hasVoted, isCreator, votedCandidateIds } = election;
      const electionData = this.formatElectionData(election.fullInfo);
      return {
        ...electionData,
        hasVoted,
        isCreator,
        votedCandidateIds,
      };
    } catch (error) {
      console.error('Failed to get election data:', error);
      throw new NotFoundException(
        'Failed to get election data by address: ' + error.shortMessage,
      );
    }
  }

  async voteInElectionWithSignature(params: {
    userId: string;
    electionAddress: string;
    candidateId?: number;
    candidateIds?: number[];
  }) {
    const { userId, electionAddress, candidateId, candidateIds } = params;

    const {
      electionType,
      id: electionId,
      creator,
    } = await this.getElectionData(electionAddress, userId);

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const voterWallet = await this.getUserWallet(userId);

    const voteTypes = cfg.types;
    let value, voteSignature, authSignature;

    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    const domain = {
      name: '',
      version: '1',
      chainId,
      verifyingContract: electionAddress,
    };

    const electionContract = new ethers.Contract(
      electionAddress,
      cfg.abi as any,
      this.adminWallet,
    );
    domain.name = cfg.domainName;

    switch (electionType) {
      case 'public_single_choice':
        value = {
          electionId,
          candidateId,
          voter: voterWallet.address,
        };

        voteSignature = await voterWallet.signTypedData(
          domain,
          voteTypes,
          value,
        );
        break;
      case 'private_single_choice':
        value = {
          electionId,
          candidateId,
          voter: voterWallet.address,
        };

        {
          const meta = await this.prisma.elections_metadata.findFirst({
            where: {
              election_address: electionAddress,
              factory_address: process.env.CONTRACT_ADDRESS,
            },
            select: { id: true },
          });
          if (!meta) throw new NotFoundException('Election metadata not found');

          const membership = await this.prisma.user_elections.findUnique({
            where: {
              user_id_election_id: {
                user_id: userId,
                election_id: meta.id,
              },
            },
            select: { id: true },
          });
          if (!membership) {
            throw new ForbiddenException(
              'You are not permitted to vote in this private election',
            );
          }
        }

        voteSignature = await voterWallet.signTypedData(
          domain,
          voteTypes,
          value,
        );

        const creatorWalletRow = await this.prisma.wallets.findFirst({
          where: {
            public_address: {
              equals: creator,
              mode: 'insensitive',
            },
          },
          select: { vault_key_name: true },
        });
        if (!creatorWalletRow?.vault_key_name) {
          throw new NotFoundException(
            'Creator wallet not found for this election',
          );
        }
        const creatorPrivateKey = await this.azureKeyVaultService.getPrivateKey(
          creatorWalletRow.vault_key_name,
        );
        const creatorOwnerWallet = new ethers.Wallet(
          creatorPrivateKey,
          this.provider,
        );

        const authTypes = {
          Auth: [
            { name: 'electionId', type: 'uint256' },
            { name: 'voter', type: 'address' },
          ],
        };
        const authValue = {
          electionId: electionId,
          voter: voterWallet.address,
        };

        authSignature = await creatorOwnerWallet.signTypedData(
          domain,
          authTypes,
          authValue,
        );
        break;
      default:
    }

    try {
      const args = cfg.buildAgs({
        candidateId: value.candidateId,
        voter: value.voter,
        voteSignature,
        authSignature,
      });
      const tx = await electionContract[cfg.method](...args);
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }

  async startElection(address: string, userId: string) {
    const creatorWallet = await this.getUserWallet(userId);

    const { electionType, isActive, creator } = await this.getElectionData(
      address,
      userId,
    );

    if (isActive) throw new Error('Election has already started');
    if (creator != creatorWallet.address)
      throw new ForbiddenException('Only creator can start the election');

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const electionContract = new ethers.Contract(
      address,
      cfg.abi as any,
      this.adminWallet,
    );

    try {
      const tx = await electionContract.startElection();
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }

  async stopElection(address: string, userId: string) {
    const creatorWallet = await this.getUserWallet(userId);

    const { electionType, isActive, creator } = await this.getElectionData(
      address,
      userId,
    );

    if (!isActive) throw new Error('Election has already ended');
    if (creator != creatorWallet.address)
      throw new ForbiddenException('Only creator can stop the election');

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const electionContract = new ethers.Contract(
      address,
      cfg.abi as any,
      this.adminWallet,
    );

    try {
      const tx = await electionContract.endElection();
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }

  async editCandidate(
    address: string,
    candidateId: number,
    newName: string,
    userId: string,
  ) {
    const creatorWallet = await this.getUserWallet(userId);

    const { electionType, isActive, startTime, endTime, creator, candidates } =
      await this.getElectionData(address, userId);

    if (isActive)
      throw new Error(`You can't change candidate name in ongoing election`);
    if (endTime > 0)
      throw new Error(`You can't change candidate name in finished election`);
    if (creator != creatorWallet.address)
      throw new ForbiddenException(
        'Only creator can edit candidate information',
      );
    if (!candidates[candidateId])
      throw new Error(
        `There is no candidate with id ${candidateId} in this election`,
      );
    if (candidates[candidateId]?.name == newName)
      throw new Error(`You can't change candidate's name to same one`);

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const electionContract = new ethers.Contract(
      address,
      cfg.abi as any,
      this.adminWallet,
    );

    try {
      const tx = await electionContract.editCandidateName(candidateId, newName);
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }

  async addCandidates(
    address: string,
    candidateNames: string[],
    userId: string,
  ) {
    const creatorWallet = await this.getUserWallet(userId);

    const { electionType, isActive, startTime, endTime, creator } =
      await this.getElectionData(address, userId);

    if (isActive)
      throw new Error(`You can't add candidate to ongoing election`);
    if (endTime > 0)
      throw new Error(`You can't add candidate to finished election`);
    if (creator != creatorWallet.address)
      throw new ForbiddenException('Only creator can add candidate');

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const electionContract = new ethers.Contract(
      address,
      cfg.abi as any,
      this.adminWallet,
    );

    try {
      const tx = await electionContract.addCandidates([...candidateNames]);
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }

  async removeCandidate(address: string, candidateId: number, userId: string) {
    const creatorWallet = await this.getUserWallet(userId);

    const { electionType, isActive, startTime, endTime, creator, candidates } =
      await this.getElectionData(address, userId);

    if (isActive)
      throw new Error(`You can't remove candidates from ongoing election`);
    if (endTime > 0)
      throw new Error(`You can't emove candidates from finished election`);
    if (creator != creatorWallet.address)
      throw new ForbiddenException('Only creator can remove candidate');
    if (!candidates[candidateId]) {
      throw new Error(`There is no candidate with id ${candidateId}`);
    }

    const cfg = VOTE_REGISTRY[electionType as any];
    if (!cfg) {
      throw new Error(`Unsupported election type: ${electionType}`);
    }

    const electionContract = new ethers.Contract(
      address,
      cfg.abi as any,
      this.adminWallet,
    );

    try {
      const tx = await electionContract.removeCandidate(candidateId);
      return { txHash: tx.hash };
    } catch (err: any) {
      const msg =
        err?.shortMessage || err?.reason || err?.message || String(err);
      console.error(err);
      throw new Error(msg);
    }
  }
}
