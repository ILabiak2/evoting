const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingFactory", function () {
  let voting;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const VotingFactory = await ethers.getContractFactory("VotingFactory");
    voting = await VotingFactory.deploy();
  });

  describe("createPublicElection", function () {
    it("Створює голосування з негайним стартом", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);

      await voting.createPublicElection("Голосування 1",["Кандидат 1"], 0, true);
      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].name).to.equal("Голосування 1");
      expect(elections[0].isActive).to.equal(true);
      expect(elections[0].startedManually).to.equal(false);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].name).to.equal("Голосування 1");
      expect(activeElections[0].id).to.equal(0);
      expect(activeElections[0].candidateCount).to.equal(1);
      expect(activeElections[0].candidates[0].name).to.equal("Кандидат 1");
    });



  });

});
