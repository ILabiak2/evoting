async function main() {
  const PublicElection = await ethers.getContractFactory("PublicElection");
  const publicImpl = await PublicElection.deploy();
  await publicImpl.deployed();

  const PrivateElection = await ethers.getContractFactory("PrivateElection");
  const privateImpl = await PrivateElection.deploy();
  await privateImpl.deployed();

  const Factory = await ethers.getContractFactory("VotingFactory");
  const factory = await Factory.deploy(publicImpl.address, privateImpl.address);
  await factory.deployed();

  console.log("PublicElection implementation:", publicImpl.address);
  console.log("PrivateElection implementation:", privateImpl.address);
  console.log("VotingFactory deployed at:", factory.address);

  // Delay to ensure block propagation (especially on testnets)
  await new Promise((res) => setTimeout(res, 30000));

  // Now verify contracts
  console.log("Verifying PublicElection...");
  await hre.run("verify:verify", {
    address: publicImpl.address,
    constructorArguments: [],
  });

  console.log("Verifying PrivateElection...");
  await hre.run("verify:verify", {
    address: privateImpl.address,
    constructorArguments: [],
  });

  console.log("Verifying VotingFactory...");
  await hre.run("verify:verify", {
    address: factory.address,
    constructorArguments: [publicImpl.address, privateImpl.address],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
