import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

async function verifyContract(address, args = []) {
  try {
    console.log(`Verifying ${address}...`);
    const { stdout, stderr } = await execPromise(
      `npx hardhat verify --network arbitrumSepolia ${address} ${args.join(" ")}`
    );
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
  } catch (error) {
    console.warn(`Verification failed for ${address}: ${error.message}`);
  }
}

async function main() {
  const PublicElection = await ethers.getContractFactory("PublicElection");
  const publicImpl = await PublicElection.deploy();
  await publicImpl.waitForDeployment();

  const PrivateElection = await ethers.getContractFactory("PrivateElection");
  const privateImpl = await PrivateElection.deploy();
  await privateImpl.waitForDeployment();

  const Factory = await ethers.getContractFactory("VotingFactory");
  const factory = await Factory.deploy(publicImpl.target, privateImpl.target);
  await factory.waitForDeployment(); // ✅ Wait for deployment

  const publicAddr = await publicImpl.getAddress();
  const privateAddr = await privateImpl.getAddress();
  const factoryAddr = await factory.getAddress();

  console.log("PublicElection implementation:", publicAddr);
  console.log("PrivateElection implementation:", privateAddr);
  console.log("VotingFactory deployed at:", factoryAddr);

  // Delay to ensure block propagation (especially on testnets)
  
  // await new Promise((res) => setTimeout(res, 30000));

  // await verifyContract(publicAddr, ['--force']);
  // await verifyContract(privateAddr, ['--force']);
  // await verifyContract(factoryAddr, [publicAddr, privateAddr, '--force']);

  // try {
  //   console.log("Verifying PublicElection...");
  //   await hre.run("verify:verify", {
  //     address: publicImpl.target,
  //     constructorArguments: [],
  //   });
  // } catch (e) {
  //   console.warn("PublicElection verification skipped or failed:", e.message);
  // }

  // try {
  //   console.log("Verifying PrivateElection...");
  //   await hre.run("verify:verify", {
  //     address: privateImpl.target,
  //     constructorArguments: [],
  //   });
  // } catch (e) {
  //   console.warn("PrivateElection verification skipped or failed:", e.message);
  // }

  // try {
  //   console.log("Verifying VotingFactory...");
  //   await hre.run("verify:verify", {
  //     address: factory.target,
  //     constructorArguments: [publicImpl.target, privateImpl.target],
  //   });
  // } catch (e) {
  //   console.warn("VotingFactory verification skipped or failed:", e.message);
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
