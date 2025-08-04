Command to deploy smart contract (deploys to Arbitrum Sepolia)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

Command to generate types for NestJS server (common.ts and VotingSystem.ts files)

```bash
npx typechain --target ethers-v6 --out-dir src/types artifacts/contracts/VotingFactory.sol/VotingFactory.json 
```

Command to verify smart contract

npx hardhat clean
```bash
npx hardhat verify --network arbitrumSepolia <contract>
```

Run test

```bash
npx hardhat test
```

Generate types for contract

```bash
npx hardhat typechain
```
