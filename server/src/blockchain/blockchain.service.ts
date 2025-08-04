import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { VotingFactory } from './abi/VotingFactory';
import * as VotingFactoryABI from './abi/VotingFactory.json';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';
import { CreateElectionParams } from './types/election.interface';
import { ElectionType } from './types/election-type.enum';

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
  // private readonly azureKeyVaultService: AzureKeyVaultService;
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
      VotingFactoryABI.abi as any,
      this.provider,
    ) as unknown as VotingFactory;
    // this.contractWithSigner = this.contract.connect(this.adminWallet);
  }

  async getDomain() {
    const network = await this.provider.getNetwork();

    return {
      name: 'VotingFactory',
      version: '1',
      chainId: network.chainId,
      verifyingContract: this.contract.target.toString(),
    };
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

  async getUserElections(userId: string) {
    const vaultKeyName = `wallet-key-${userId}`;
    // console.log(vaultKeyName);
    const privateKey =
      await this.azureKeyVaultService.getPrivateKey(vaultKeyName);
    const userWallet = new ethers.Wallet(privateKey, this.provider);

    const contractWithSigner = this.contract.connect(userWallet);

    const electionsRaw = await contractWithSigner.getMyElections();

    const elections = electionsRaw.map((election: any) => {
      const {
        coreData,
        electionType,
        contractAddress,
      } = election;

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
        electionType,
        contractAddress,
        candidates,
        totalVotes
      };


    });

    return elections;
  }

  // If you need to send transactions:
  async writeSomething() {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    const contractWithSigner = this.contract.connect(wallet);
    // const tx = await contractWithSigner.someFunction(...args);
    // await tx.wait();
    // return tx.hash;
  }
}
