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

    it("Отримання інформації про голосування користувача", async () => {
      let elections = await voting.connect(user1).getMyElections();
      expect(elections.length).to.equal(0);

      for (let i = 0; i < 3; i++) {
        await voting
          .connect(user1)
          .createPublicElection(`Election ${i}`, ["Кандидат 1"], 0, false);
      }

      for (let i = 0; i < 5; i++) {
        await voting
          .connect(user2)
          .createPublicElection(`Election2 ${i}`, ["Кандидат 2"], 0, false);
      }

      elections = await voting.connect(user1).getMyElections();

      expect(elections.length).to.equal(3);
      expect(elections[0].coreData.name).to.equal(`Election 0`);
      expect(elections[1].coreData.name).to.equal(`Election 1`);
      expect(elections[2].coreData.name).to.equal(`Election 2`);
    });

    it("Створює голосування з підписом творця голосування", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);
      const { chainId: chain } = await ethers.provider.getNetwork();
      let chainId = chain;
      const domain = {
        name: "VotingFactory",
        version: "1",
        chainId,
        verifyingContract: voting.target,
      };

      const types = {
        Election: [
          { name: "name", type: "string" },
          { name: "startImmediately", type: "bool" },
          { name: "voterLimit", type: "uint256" },
          { name: "creator", type: "address" },
        ],
      };

      const value = {
        name: "Election via signature",
        startImmediately: true,
        voterLimit: 100,
        creator: user1.address,
      };

      const signature = await user1.signTypedData(domain, types, value);

      await voting
        .connect(user2)
        .createPublicElectionWithSignature(
          value.name,
          value.startImmediately,
          value.voterLimit,
          value.creator,
          ["Кандидат 1"],
          signature
        );

      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].coreData.name).to.equal("Election via signature");
      expect(elections[0].coreData.isActive).to.equal(true);
      expect(elections[0].coreData.startedManually).to.equal(false);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].coreData.name).to.equal(
        "Election via signature"
      );
      expect(activeElections[0].coreData.id).to.equal(0);
      expect(activeElections[0].coreData.candidateCount).to.equal(1);
    });

    it("Створює голосування з неправильним підписом творця голосування", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);
      const { chainId: chain } = await ethers.provider.getNetwork();
      let chainId = chain;

      const domain = {
        name: "VotingFactory",
        version: "1",
        chainId,
        verifyingContract: voting.target,
      };

      const types = {
        Election: [
          { name: "name", type: "string" },
          { name: "startImmediately", type: "bool" },
          { name: "voterLimit", type: "uint256" },
          { name: "creator", type: "address" },
        ],
      };

      const value = {
        name: "Election via signature",
        startImmediately: true,
        voterLimit: 100,
        creator: user2.address,
      };

      const signature = await user1.signTypedData(domain, types, value);

      await expect(
        voting
          .connect(user2)
          .createPublicElectionWithSignature(
            value.name,
            value.startImmediately,
            value.voterLimit,
            value.creator,
            ["Кандидат 1"],
            signature
          )
      ).to.be.revertedWith("Invalid signature");

      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(0);
    });
  });

  describe("addCandidate", function () {
    it("Додає кандидатів до виборів", async function () {
      const tx = await voting.createPrivateElection(
        "Голосування 1",
        ["Кандидат 1"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      const electionAddress = event?.args.contractAddress;

      const election = await ethers.getContractAt(
        "PrivateElection",
        electionAddress
      );

      await election.addCandidates(["Кандидат 2"]);

      const all = await voting.getAllElections();
      expect(all[0].coreData.candidateCount).to.equal(2);
      expect(all[0].coreData.candidates[0].name).to.equal("Кандидат 1");
      expect(all[0].coreData.candidates[1].name).to.equal("Кандидат 2");

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].coreData.name).to.equal("Голосування 1");
      expect(activeElections[0].coreData.id).to.equal(0);
      expect(activeElections[0].coreData.candidateCount).to.equal(2);
      expect(activeElections[0].coreData.candidates[0].name).to.equal(
        "Кандидат 1"
      );
      expect(activeElections[0].coreData.candidates[1].name).to.equal(
        "Кандидат 2"
      );
      expect(activeElections[0].coreData.candidates.length).to.equal(2);
    });

    it("Забороняє додавати більше ніж MAX_CANDIDATES", async function () {
      const tx = await voting.createPrivateElection(
        "Test 1",
        ["Кандидат 1"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      const electionAddress = event?.args.contractAddress;

      const election = await ethers.getContractAt(
        "PrivateElection",
        electionAddress
      );

      for (let i = 0; i < 99; i++) {
        await election.addCandidates([`Канд. ${i}`]);
      }

      await expect(election.addCandidates(["Перевищення"])).to.be.revertedWith(
        "Exceeds max candidates"
      );
    });

    it("не дозволяє додати кандидатів з однаковим ім'ям у те саме голосування", async () => {
      const tx = await voting.createPrivateElection(
        "Вибори",
        ["Іван Іванович"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      const electionAddress = event?.args.contractAddress;

      const election = await ethers.getContractAt(
        "PrivateElection",
        electionAddress
      );

      // Спроба додати кандидата з тим самим ім'ям має завершитися з помилкою
      await expect(
        election.addCandidates(["Іван Іванович"])
      ).to.be.revertedWith("Duplicate candidate name");
    });
  });

  describe("addCandidates", function () {
    let electionAddress;
    let election;
    const electionName = "Test Election";
    const candidateNames = ["Alice", "Bob", "Charlie"];

    beforeEach(async function () {
      // await voting.createPublicElection(electionName, ["First"], 0, true);
      const tx = await voting.createPublicElection(
        electionName,
        ["First"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt(
        "PrivateElection",
        electionAddress
      );
    });

    async function getElectionWithCandidates() {
      return await election.getCoreElectionData();
    }

    it("Успішне додавання декількох кандидатів", async function () {
      await election.addCandidates(candidateNames);

      const electionData = await getElectionWithCandidates();
      expect(electionData.candidateCount).to.equal(candidateNames.length + 1);

      for (let i = 0; i < candidateNames.length; i++) {
        expect(electionData.candidates[i + 1].name).to.equal(candidateNames[i]);
      }
    });

    it("Помилка, якщо кількість кандидатів більша за максимум", async function () {
      const MAX = 100;
      const tooMany = Array(MAX + 1).fill("Name");

      await expect(election.addCandidates(tooMany)).to.be.revertedWith(
        "Exceeds max candidates"
      );
    });

    it("Помилка при додаванні кандидатів з однаковим іменем", async function () {
      const withDuplicates = ["Alice", "Bob", "Alice"];

      await expect(election.addCandidates(withDuplicates)).to.be.revertedWith(
        "Duplicate candidate name"
      );
    });

    it("Помилка, якщо користувач, який додає кандидатів, не є адміном або творцем", async function () {
      await expect(
        election.connect(user1).addCandidates(candidateNames)
      ).to.be.revertedWith("Not creator or admin");
    });

    it("Додавання кандидатів кількома викликами функції", async function () {
      await election.addCandidates(["Alice", "Bob"]);
      await election.addCandidates(["Charlie", "Dave"]);

      const electionData = await getElectionWithCandidates(0);
      expect(electionData.candidateCount).to.equal(5);

      const expectedNames = ["Alice", "Bob", "Charlie", "Dave"];
      for (let i = 0; i < 4; i++) {
        expect(electionData.candidates[i + 1].name).to.equal(expectedNames[i]);
      }
    });
  });
});
