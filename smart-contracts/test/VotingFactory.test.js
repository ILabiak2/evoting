const { expect } = require("chai");
const { ethers } = require("hardhat");

const electionTypeLabels = ["Public", "Private"];

const voteTypes = {
  Vote: [
    { name: "electionId", type: "uint256" },
    { name: "candidateId", type: "uint256" },
    { name: "voter", type: "address" },
  ],
};

const authTypes = {
  Auth: [
    { name: "electionId", type: "uint256" },
    { name: "voter", type: "address" },
  ],
};

describe("VotingFactory", function () {
  let voting, publicElectionImpl, privateElectionImpl;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const PublicElection = await ethers.getContractFactory("PublicElection");
    publicElectionImpl = await PublicElection.deploy();

    const PrivateElection = await ethers.getContractFactory("PrivateElection");
    privateElectionImpl = await PrivateElection.deploy();

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

      election = await ethers.getContractAt("PublicElection", electionAddress);
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

  describe("startElection / endElection", function () {
    it("Запускає і завершує голосування", async function () {
      const tx = await voting.createPrivateElection(
        "Тест",
        ["Кандидат 1"],
        0,
        false
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PrivateElection", electionAddress);
      await election.startElection();
      let all = await voting.getAllElections();
      expect(all[0].coreData.isActive).to.equal(true);
      expect(all[0].coreData.startedManually).to.equal(true);

      await election.endElection();
      all = await voting.getAllElections();
      expect(all[0].coreData.isActive).to.equal(false);
      expect(all[0].coreData.endedManually).to.equal(true);
    });
  });

  describe("stop/start election", function () {
    it("не дозволяє повторно запустити вибори після завершення", async function () {
      const tx = await voting.createPrivateElection(
        "Одноразові вибори",
        ["Кандидат X"],
        0,
        false
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PrivateElection", electionAddress);

      await election.startElection();

      await election.endElection();

      await expect(election.startElection()).to.be.revertedWith(
        "Election has been already manually ended"
      );
    });
  });

  describe("vote", function () {
    let election;
    beforeEach(async () => {
      const tx = await voting.createPublicElection(
        "Vote Test",
        ["Кандидат"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PublicElection", electionAddress);
    });

    it("Дозволяє голосування користувачу", async function () {
      await election.connect(user1).vote(0);
      const elections = await voting.getAllElections();
      expect(elections[0].coreData.candidates[0].voteCount).to.equal(1);
    });

    it("Не дозволяє голосувати двічі", async function () {
      await election.connect(user1).vote(0);
      await expect(election.connect(user1).vote(0)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("Не дозволяє голосувати неактивні вибори", async function () {
      const tx = await voting.createPublicElection("Інше", ["Канд."], 0, false);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      const election2 = await ethers.getContractAt(
        "PublicElection",
        electionAddress
      );
      await expect(election2.connect(user1).vote(1)).to.be.revertedWith(
        "Election is not active"
      );
    });

    it("Голосування у приватному голосуванні", async function () {
      const tx = await voting.createPrivateElection(
        "Приватне голосування",
        ["Кандидат 1"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      const election2 = await ethers.getContractAt(
        "PrivateElection",
        electionAddress
      );
      await expect(election2.connect(user1).vote(0)).to.be.revertedWith(
        "You need to use authSignature"
      );

      const { chainId: chain } = await ethers.provider.getNetwork();

      domain = {
        name: "PrivateElection",
        version: "1",
        chainId: chain,
        verifyingContract: electionAddress,
      };

      const authValue = {
        electionId: 1,
        voter: user1.address,
      };
      const authSignature = await owner.signTypedData(
        domain,
        authTypes,
        authValue
      );

      await election2.connect(user1).getFunction("vote(uint256,bytes)")(
        0,
        authSignature
      );
    });

    it("Завершує вибори, якщо досягнуто ліміту голосів", async function () {
      const tx = await voting.createPublicElection(
        "Обмежене",
        ["Кандидат 1"],
        1,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      const election2 = await ethers.getContractAt(
        "PublicElection",
        electionAddress
      );

      await election2.connect(user1).vote(0);
      const all = await voting.getAllElections();
      expect(all[1].coreData.isActive).to.equal(false);
      expect(all[1].coreData.endedManually).to.equal(true);
    });
  });

  describe("getMyVote", function () {
    it("Повертає правильний статус голосування", async function () {
      const tx = await voting.createPublicElection(
        "Голосування",
        ["Кандидат 1"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      const election = await ethers.getContractAt(
        "PublicElection",
        electionAddress
      );

      const voteBefore = await election.connect(user1).getMyVote();
      expect(voteBefore.userVoted).to.equal(false);
      expect(voteBefore.candidateId).to.equal(ethers.MaxUint256);
      expect(voteBefore.candidateName).to.equal("");

      await election.connect(user1).vote(0);

      const voteAfter = await election.connect(user1).getMyVote();
      expect(voteAfter.userVoted).to.equal(true);
      expect(voteAfter.candidateId).to.equal(0);
      expect(voteAfter.candidateName).to.equal("Кандидат 1");
    });
  });

  describe("getResults", function () {
    it("Повертає результати після завершення виборів", async function () {
      const tx = await voting.createPublicElection("Results", ["A"], 1, true);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PublicElection", electionAddress);

      await election.connect(user1).vote(0);

      const results = await election.getResults();
      expect(results[0].name).to.equal("A");
      expect(results[0].voteCount).to.equal(1);
    });

    it("Не повертає результати до завершення", async function () {
      const tx = await voting.createPublicElection("Not ended", ["X"], 0, true);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PublicElection", electionAddress);

      await expect(election.getResults()).to.be.revertedWith(
        "Election has not ended yet"
      );
    });
  });

  describe("voteWithSignature", function () {
    let election, electionId;
    let chainId, domain;
    const domainName = "PrivateElection";
    const domainVersion = "1";

    beforeEach(async () => {
      const tx = await voting.createPrivateElection(
        "Підписне голосування",
        ["Кандидат 1"],
        0,
        true
      );
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((parsed) => parsed?.name === "ElectionCreated");
      electionAddress = event?.args.contractAddress;

      election = await ethers.getContractAt("PrivateElection", electionAddress);
      electionId = 0;

      const { chainId: chain } = await ethers.provider.getNetwork();
      chainId = chain;

      domain = {
        name: domainName,
        version: domainVersion,
        chainId,
        verifyingContract: electionAddress,
      };
    });

    it("Успішно голосує через підпис", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const value = {
        electionId: 0,
        candidateId,
        voter: voterAddress,
      };

      const voteSignature = await user1.signTypedData(domain, voteTypes, value);

      const authValue = {
        electionId: 0,
        voter: voterAddress,
      };
      const authSignature = await owner.signTypedData(
        domain,
        authTypes,
        authValue
      );

      // Голосує через підпис
      await election
        .connect(user2)
        .getFunction("voteWithSignature(uint256,address,bytes,bytes)")(
        candidateId,
        voterAddress,
        voteSignature,
        authSignature
      );

      const elections = await voting.getAllElections();
      expect(elections[0].coreData.candidates[candidateId].voteCount).to.equal(
        1
      );
    });

    it("Не дозволяє голосувати двічі з підписом", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const value = {
        electionId,
        candidateId,
        voter: voterAddress,
      };

      const voteSignature = await user1.signTypedData(domain, voteTypes, value);

      const authValue = {
        electionId,
        voter: voterAddress,
      };
      const authSignature = await owner.signTypedData(
        domain,
        authTypes,
        authValue
      );

      await election
        .connect(owner)
        .getFunction("voteWithSignature(uint256,address,bytes,bytes)")(
        candidateId,
        voterAddress,
        voteSignature,
        authSignature
      );

      // Повторне використання того ж підпису
      await expect(
        election
          .connect(owner)
          .getFunction("voteWithSignature(uint256,address,bytes,bytes)")(
          candidateId,
          voterAddress,
          voteSignature,
          authSignature
        )
      ).to.be.revertedWith("Already voted");
    });

    it("Викидає помилку при фальшивому підписі виборця", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const packedData = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "address"],
        [electionId, candidateId, voterAddress]
      );

      // user2 підписує повідомлення, але передаємо ніби це user1
      const fakeVoteSignature = await user2.signMessage(
        ethers.getBytes(packedData)
      );

      const authValue = {
        electionId,
        voter: voterAddress,
      };

      const authSignature = await owner.signTypedData(
        domain,
        authTypes,
        authValue
      );

      await expect(
        election
          .connect(owner)
          .getFunction("voteWithSignature(uint256,address,bytes,bytes)")(
          candidateId,
          user1.address,
          fakeVoteSignature,
          authSignature
        )
      ).to.be.revertedWith("Invalid signature");
    });

    it("Викидає помилку при фальшивому підписі власника контракту", async function () {
      const candidateId = 0;
      const voterAddress = user1.address;

      const value = {
        electionId,
        candidateId,
        voter: voterAddress,
      };

      const voteSignature = await user1.signTypedData(domain, voteTypes, value);

      const authValue = {
        electionId,
        voter: voterAddress,
      };

      const fakeAuthSignature = await user2.signTypedData(
        domain,
        authTypes,
        authValue
      );

      await expect(
        election
          .connect(owner)
          .getFunction("voteWithSignature(uint256,address,bytes,bytes)")(
          candidateId,
          user1.address,
          voteSignature,
          fakeAuthSignature
        )
      ).to.be.revertedWith("Not authorized by owner");
    });
  });
});
