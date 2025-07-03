import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as VotingSystemABI from './abi/VotingSystem.json';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    this.contract = new ethers.Contract(
      contractAddress,
      VotingSystemABI.abi,
      this.provider
    );
  }

  async getSomething() {
    const result = await this.contract.getAddress();
    return result;
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