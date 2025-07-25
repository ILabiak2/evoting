Command to deploy smart contract (deploys to Arbitrum Sepolia)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

Command to generate types for NestJS server (common.ts and VotingSystem.ts files)

```bash
npx typechain --target ethers-v6 --out-dir src/types artifacts/contracts/VotingSystem.sol/VotingSystem.json 
```

Command to verify smart contract

```bash
npx hardhat verify --network arbitrumSepolia <contract>
```
