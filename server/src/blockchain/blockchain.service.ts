import { Injectable, NotFoundException } from '@nestjs/common';
import { ethers } from 'ethers';
import { VotingFactory } from './_types/VotingFactory';
import * as VotingFactoryABI from './_abi/VotingFactory.json';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';
import { CreateElectionParams } from './types/election.interface';
import {
  ElectionType,
  ElectionTypeFromNumber,
} from './types/election-type.enum';

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
  // private contractWithSigner: ethers.Contract;

  constructor(private readonly azureKeyVaultService: AzureKeyVaultService) {
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
    // this.contractWithSigner = this.contract.connect(this.adminWallet);
  }

  formatElectionData(election: any) {
    const { coreData, electionType, contractAddress } = election;

    const {
      id,
      name,
      startTime,
      endTime,
      creator,
      isActive,
      startedManually,
      endedManually,
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
      startTime: Number(startTime),
      endTime: Number(endTime),
      creator,
      isActive,
      startedManually,
      endedManually,
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

  async getSigner(userId: string) {
    const vaultKeyName = `wallet-key-${userId}`;
    const privateKey =
      await this.azureKeyVaultService.getPrivateKey(vaultKeyName);
    const userWallet = new ethers.Wallet(privateKey, this.provider);

    return this.contract.connect(userWallet);
  }

  async getSomething() {
    const result = await this.contract.getAddress();
    return result;
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
    const vaultKeyName = `wallet-key-${userId}`;
    const privateKey =
      await this.azureKeyVaultService.getPrivateKey(vaultKeyName);
    const userWallet = new ethers.Wallet(privateKey);
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

  async checkElectionCreated(
    txHash: string,
  ): Promise<{ confirmed: boolean; electionId?: number }> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt || (await receipt.confirmations()) === 0) {
      return { confirmed: false };
    }

    const events = await this.contract.queryFilter(
      this.contract.filters.ElectionCreated(),
      receipt.blockNumber,
      receipt.blockNumber,
    );
    const event = events.find((e) => e.transactionHash === txHash);

    if (!event) return { confirmed: false };

    return {
      confirmed: true,
      electionId: Number(event.args?.id),
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

  async writeSomething() {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    const contractWithSigner = this.contract.connect(wallet);
    // const tx = await contractWithSigner.someFunction(...args);
    // await tx.wait();
    // return tx.hash;
  }
}
