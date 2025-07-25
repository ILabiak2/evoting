import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { VotingSystem } from './abi/VotingSystem';
import * as VotingSystemABI from './abi/VotingSystem.json';
import { AzureKeyVaultService } from '@/services/azure-key-vault.service';

declare global {
  interface BigInt {
      toJSON(): Number;
  }
}

BigInt.prototype.toJSON = function () { return Number(this) }

@Injectable()
export class BlockchainService {
  // private readonly azureKeyVaultService: AzureKeyVaultService;
  private provider: ethers.JsonRpcProvider;
  private contract: VotingSystem;
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
      VotingSystemABI.abi as any,
      this.provider,
    ) as unknown as VotingSystem;
    // this.contractWithSigner = this.contract.connect(this.adminWallet);
  }

  async getDomain() {
    const network = await this.provider.getNetwork();

    return {
      name: 'VotingSystem',
      version: '1',
      chainId: network.chainId,
      verifyingContract: this.contract.target.toString(),
    };
  }

  async getSomething() {
    const result = await this.contract.getAddress();
    return result;
  }

  async createElectionWithSignature(
    userId: string,
    name: string,
    startImmediately: boolean,
    voterLimit: number,
    candidateNames: string[],
  ) {
    // console.log(userId);
    const vaultKeyName = `wallet-key-${userId}`;
    const privateKey =
      await this.azureKeyVaultService.getPrivateKey(vaultKeyName);
    const userWallet = new ethers.Wallet(privateKey);

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

    const contractWithAdminSigner = this.contract.connect(this.adminWallet);

    try {
      const tx = await contractWithAdminSigner.createElectionWithSignature(
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
      electionId: Number(event.args?.electionId),
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

    const elections = electionsRaw.map((election: any[]) => {
      const [
        id,
        name,
        startTime,
        endTime,
        isActive,
        startedManually,
        endedManually,
        candidateCount,
        // Possibly more fields here...
        ,
        candidatesRaw
      ] = election;
  
      const candidates = candidatesRaw.map(([id, name, votes]: any[]) => ({
        id,
        name,
        votes: Number(votes),
      }));

      const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  
      return {
        id,
        name,
        startTime,
        endTime,
        isActive,
        startedManually,
        endedManually,
        candidateCount,
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
