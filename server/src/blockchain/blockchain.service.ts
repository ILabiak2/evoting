import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as VotingSystemABI from './abi/VotingSystem.json';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private adminWallet: ethers.Wallet;
  private contractWithSigner: ethers.BaseContract;

  constructor() {
    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(process.env.CREATOR_PRIVATE_KEY, this.provider);

    this.contract = new ethers.Contract(
      contractAddress,
      VotingSystemABI.abi,
      this.provider
    );
    this.contractWithSigner = this.contract.connect(this.adminWallet);
  }

  async getSomething() {
    const result = await this.contract.getAddress();
    return result;
  }

  async createElectionWithSignature(){
    
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