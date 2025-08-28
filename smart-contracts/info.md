Command to generate types and automatically pass them to server folder

```bash
npm run build
```

Command to deploy smart contracts (deploys to Arbitrum Sepolia)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

Command to verify smart contracts

```bash
npx hardhat run scripts/verify.js
```




Command to verify smart contract

```bash
npx hardhat verify --network arbitrumSepolia <contract>
```

Command to generate types for NestJS server (common.ts and VotingFactory.ts files)

```bash
npx typechain --target ethers-v6 --out-dir src/types artifacts/contracts/VotingFactory.sol/VotingFactory.json 
```

Run test

```bash
npx hardhat test
```
