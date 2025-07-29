const { expect } = require("chai");
const { ethers } = require("hardhat");

const electionTypeLabels = ["Public", "Private"];

describe("VotingFactory", function () {
  let voting;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    // 1. Deploy logic implementations
    const PublicElection = await ethers.getContractFactory("PublicElection");
    const publicElectionImpl = await PublicElection.deploy();
    
    const PrivateElection = await ethers.getContractFactory("PrivateElection");
    const privateElectionImpl = await PrivateElection.deploy();

    // 2. Deploy factory with implementation addresses
    const VotingFactory = await ethers.getContractFactory("VotingFactory");
    voting = await VotingFactory.deploy(
      publicElectionImpl.target,
      privateElectionImpl.target
    );
  });

  describe("createPublicElection", function () {
    it("Створює голосування з негайним стартом", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);

      await voting.createPublicElection(
        "Голосування 1",
        ["Кандидат 1"],
        0,
        true
      );
      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].coreData.name).to.equal("Голосування 1");
      expect(electionTypeLabels[elections[0].electionType]).to.equal("Public");
      expect(elections[0].coreData.isActive).to.equal(true);
      expect(elections[0].coreData.startedManually).to.equal(false);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].coreData.name).to.equal("Голосування 1");
      expect(activeElections[0].coreData.id).to.equal(0);
      expect(activeElections[0].coreData.candidateCount).to.equal(1);
      expect(activeElections[0].coreData.candidates[0].name).to.equal(
        "Кандидат 1"
      );
    });

    it("Створює голосування без старту", async function () {
      await voting.createPublicElection(
        "Голосування 2",
        ["Кандидат 1"],
        100,
        false
      );
      const elections = await voting.getAllElections();
      expect(elections.length).to.equal(1);
      expect(elections[0].coreData.isActive).to.equal(false);
      expect(elections[0].coreData.voterLimit).to.equal(100);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(0);
    });

    it("Отримання інформації про вибрані голосування за ID]", async () => {
      const ids = [0, 2, 5, 9];

      let elections = await voting.getElectionsByIds(ids);
      expect(elections.length).to.equal(0);

      for (let i = 0; i < 10; i++) {
        await voting.createPublicElection(
          `Election ${i}`,
          ["Кандидат 1"],
          0,
          false
        );
      }

      elections = await voting.getElectionsByIds(ids);

      expect(elections.length).to.equal(4);
      for (let i = 0; i < ids.length; i++) {
        const election = elections[i];
        expect(election.coreData.id).to.equal(ids[i]);
        expect(election.coreData.name).to.equal(`Election ${ids[i]}`);
        expect(election.coreData.candidateCount).to.equal(1);
      }

      ids.unshift(123123);
      elections = await voting.getElectionsByIds(ids);
      // console.log(elections);

      expect(elections.length).to.equal(4);
      expect(elections[0].coreData.name).to.equal(`Election 0`);
      expect(elections[1].coreData.name).to.equal(`Election 2`);
      expect(elections[2].coreData.name).to.equal(`Election 5`);
      expect(elections[3].coreData.name).to.equal(`Election 9`);
    });
  });
});
