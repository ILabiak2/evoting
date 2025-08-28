import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "addresses.json");
const {
  publicAddr,
  privateAddr,
  publicMultiAddr,
  privateMultiAddr,
  factoryAddr,
} = JSON.parse(fs.readFileSync(configPath, "utf8"));

async function verifyContract(address, args = []) {
  try {
    console.log(`Verifying ${address}...`);
    const { stdout, stderr } = await execPromise(
      `npx hardhat verify --network arbitrumSepolia ${address} ${args.join(
        " "
      )}`
    );
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
  } catch (error) {
    console.warn(`Verification failed for ${address}: ${error.message}`);
  }
}

async function main() {
  await verifyContract(publicAddr);
  await verifyContract(privateAddr);
  await verifyContract(publicMultiAddr);
  await verifyContract(privateMultiAddr);
  await verifyContract(factoryAddr, [
    publicAddr,
    privateAddr,
    publicMultiAddr,
    privateMultiAddr,
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
