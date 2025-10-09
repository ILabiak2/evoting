const domain = {
  name: cfg.domainName,
  version: "1",
  chainId,
  verifyingContract: electionAddress,
};

const authTypes = {
  Auth: [
    { name: "electionId", type: "uint256" },
    { name: "voter", type: "address" },
  ],
};
const authValue = {electionId: electionId, voter: voterWallet.address};

authSignature = await creatorOwnerWallet.signTypedData(domain, authTypes, authValue);
