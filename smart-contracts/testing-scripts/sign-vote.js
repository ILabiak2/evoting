const ethers = require("ethers"); // ethers@5

const voterAddress = "0x6BeFb4de997398b56455cedb06346C90122797A4";
const privateKey = "0x1220212e881c8e2a38e107f1dedc573fb76708829216b1cbfd29476a8eef7b89";
const electionId = 0;
const candidateId = 0;

async function signVote(voter, electionId, candidateId, privateKey) {
  const wallet = new ethers.Wallet(privateKey);

  const messageHash = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "address"],
    [electionId, candidateId, voter]
  );

  const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));

  console.log("== Підписані дані ==");
  console.log("voter:", voter);
  console.log("electionId:", electionId);
  console.log("candidateId:", candidateId);
  console.log("messageHash:", messageHash);
  console.log("signature:", signature);

  return signature;
}

signVote(voterAddress, electionId, candidateId, privateKey).catch(console.error);