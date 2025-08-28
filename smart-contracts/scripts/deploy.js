import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.join(__dirname, "addresses.json");
  fs.writeFileSync(outPath, JSON.stringify({}, null, 2));

  const PublicElection = await ethers.getContractFactory("PublicElection");
  const publicImpl = await PublicElection.deploy();
  await publicImpl.waitForDeployment();

  const PrivateElection = await ethers.getContractFactory("PrivateElection");
  const privateImpl = await PrivateElection.deploy();
  await privateImpl.waitForDeployment();

  const PublicMultiElection = await ethers.getContractFactory(
    "PublicElectionMulti"
  );
  const publicMultiImpl = await PublicMultiElection.deploy();

  const PrivateMultiElection = await ethers.getContractFactory(
    "PrivateElectionMulti"
  );
  const privateMultiImpl = await PrivateMultiElection.deploy();

  const Factory = await ethers.getContractFactory("VotingFactory");
  const factory = await Factory.deploy(
    publicImpl.target,
    privateImpl.target,
    publicMultiImpl.target,
    privateMultiImpl.target
  );
  await factory.waitForDeployment();

  const addresses = {
    publicAddr: await publicImpl.getAddress(),
    privateAddr: await privateImpl.getAddress(),
    publicMultiAddr: await publicMultiImpl.getAddress(),
    privateMultiAddr: await privateMultiImpl.getAddress(),
    factoryAddr: await factory.getAddress(),
  };

  console.log(addresses);

  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`Saved addresses to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
