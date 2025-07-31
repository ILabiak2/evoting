const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function () {
  let voting;
  let owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    voting = await VotingSystem.deploy();
  });

  describe("createElection", function () {
    it("Створює голосування з негайним стартом", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);

      await voting.createElection("Голосування 1", true, 0, ["Кандидат 1"]);
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

    it("Створює голосування без старту", async function () {
      await voting.createElection("Голосування 2", false, 100, ["Кандидат 1"]);
      const elections = await voting.getAllElections();
      expect(elections.length).to.equal(1);
      expect(elections[0].isActive).to.equal(false);
      expect(elections[0].voterLimit).to.equal(100);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(0);
    });

    it("Отримання інформації про вибрані голосування за ID]", async () => {
      const ids = [0, 2, 5, 9];

      let elections = await voting.getElectionsByIds(ids);
      expect(elections.length).to.equal(0);

      for (let i = 0; i < 10; i++) {
        await voting.createElection(`Election ${i}`, false, 0, ["Кандидат 1"]);
      }

      elections = await voting.getElectionsByIds(ids);

      expect(elections.length).to.equal(4);
      for (let i = 0; i < ids.length; i++) {
        const election = elections[i];
        expect(election.id).to.equal(ids[i]);
        expect(election.name).to.equal(`Election ${ids[i]}`);
        expect(election.candidateCount).to.equal(1);
      }

      ids.unshift(123123);
      elections = await voting.getElectionsByIds(ids);
      // console.log(elections);

      expect(elections.length).to.equal(4);
      expect(elections[0].name).to.equal(`Election 0`);
      expect(elections[1].name).to.equal(`Election 2`);
      expect(elections[2].name).to.equal(`Election 5`);
      expect(elections[3].name).to.equal(`Election 9`);
    });

    it("Отримання інформації про голосування користувача", async () => {

      let elections = await voting.connect(user1).getMyElections();
      expect(elections.length).to.equal(0);

      for (let i = 0; i < 3; i++) {
        await voting.connect(user1).createElection(`Election ${i}`, false, 0, ["Кандидат 1"]);
      }

      for (let i = 0; i < 5; i++) {
        await voting.connect(user2).createElection(`Election2 ${i}`, false, 0, ["Кандидат 2"]);
      }

      elections = await voting.connect(user1).getMyElections();

      expect(elections.length).to.equal(3);
      expect(elections[0].name).to.equal(`Election 0`);
      expect(elections[1].name).to.equal(`Election 1`);
      expect(elections[2].name).to.equal(`Election 2`);
    });

    it("Створює голосування з підписом творця голосування", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);
      const { chainId: chain } = await ethers.provider.getNetwork();
      let chainId = chain;

      const domain = {
        name: "VotingSystem",
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
        .createElectionWithSignature(
          value.name,
          value.startImmediately,
          value.voterLimit,
          value.creator,
          ["Кандидат 1"],
          signature
        );

      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].name).to.equal("Election via signature");
      expect(elections[0].isActive).to.equal(true);
      expect(elections[0].startedManually).to.equal(false);

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].name).to.equal("Election via signature");
      expect(activeElections[0].id).to.equal(0);
      expect(activeElections[0].candidateCount).to.equal(1);
    });

    it("Створює голосування з неправильним підписом творця голосування", async function () {
      const electionsBefore = await voting.getAllElections();
      expect(electionsBefore.length).to.equal(0);
      const { chainId: chain } = await ethers.provider.getNetwork();
      let chainId = chain;

      const domain = {
        name: "VotingSystem",
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
          .createElectionWithSignature(
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
      await voting.createElection("Голосування 1", true, 0, ["Кандидат 1"]);
      await voting.addCandidates(0, ["Кандидат 2"]);

      const all = await voting.getAllElections();
      expect(all[0].candidateCount).to.equal(2);
      expect(all[0].candidates[0].name).to.equal("Кандидат 1");
      expect(all[0].candidates[1].name).to.equal("Кандидат 2");

      const activeElections = await voting.getActiveElections();

      expect(activeElections.length).to.equal(1);
      expect(activeElections[0].name).to.equal("Голосування 1");
      expect(activeElections[0].id).to.equal(0);
      expect(activeElections[0].candidateCount).to.equal(2);
      expect(activeElections[0].candidates[0].name).to.equal("Кандидат 1");
      expect(activeElections[0].candidates[1].name).to.equal("Кандидат 2");
      expect(activeElections[0].candidates.length).to.equal(2);
    });

    it("Забороняє додавати більше ніж MAX_CANDIDATES", async function () {
      await voting.createElection("Test", true, 0, ["Кандидат 1"]);

      for (let i = 0; i < 99; i++) {
        await voting.addCandidates(0, [`Канд. ${i}`]);
      }

      await expect(voting.addCandidates(0, ["Перевищення"])).to.be.revertedWith(
        "Exceeds max candidates"
      );
    });

    it("не дозволяє додати кандидатів з однаковим ім'ям у те саме голосування", async () => {
      await voting.createElection("Вибори", true, 0, ["Іван Іванович"]);

      // Спроба додати кандидата з тим самим ім'ям має завершитися з помилкою
      await expect(
        voting.addCandidates(0, ["Іван Іванович"])
      ).to.be.revertedWith("Duplicate candidate name");
    });
  });

  describe("addCandidates", function () {
    let Voting, voting;
    let owner, user1;
    const electionName = "Test Election";
    const candidateNames = ["Alice", "Bob", "Charlie"];

    beforeEach(async function () {
      [owner, user1] = await ethers.getSigners();
      Voting = await ethers.getContractFactory("VotingSystem");
      voting = await Voting.deploy();
      await voting.createElection(electionName, true, 0, ["First"]); // electionId = 0
    });

    async function getElectionWithCandidates(id) {
      const elections = await voting.getElectionsByIds([id]);
      return elections[0];
    }

    it("Успішне додавання декількох кандидатів", async function () {
      await voting.addCandidates(0, candidateNames);

      const election = await getElectionWithCandidates(0);
      expect(election.candidateCount).to.equal(candidateNames.length + 1);

      for (let i = 0; i < candidateNames.length; i++) {
        expect(election.candidates[i + 1].name).to.equal(candidateNames[i]);
      }
    });

    it("Помилка, якщо кількість кандидатів більша за максимум", async function () {
      const MAX = 100;
      const tooMany = Array(MAX + 1).fill("Name");

      await expect(voting.addCandidates(0, tooMany)).to.be.revertedWith(
        "Exceeds max candidates"
      );
    });

    it("Помилка при додаванні кандидатів з однаковим іменем", async function () {
      const withDuplicates = ["Alice", "Bob", "Alice"];

      await expect(voting.addCandidates(0, withDuplicates)).to.be.revertedWith(
        "Duplicate candidate name"
      );
    });

    it("Помилка, якщо користувач, який додає кандидатів, не є адміном або творцем", async function () {
      await expect(
        voting.connect(user1).addCandidates(0, candidateNames)
      ).to.be.revertedWith("Not creator or admin");
    });

    it("Додавання кандидатів кількома викликами функції", async function () {
      await voting.addCandidates(0, ["Alice", "Bob"]);
      await voting.addCandidates(0, ["Charlie", "Dave"]);

      const election = await getElectionWithCandidates(0);
      expect(election.candidateCount).to.equal(5);

      const expectedNames = ["Alice", "Bob", "Charlie", "Dave"];
      for (let i = 0; i < 4; i++) {
        expect(election.candidates[i + 1].name).to.equal(expectedNames[i]);
      }
    });
  });

  describe("startElection / endElection", function () {
    it("Запускає і завершує голосування", async function () {
      await voting.createElection("Тест", false, 0, ["Кандидат 1"]);
      await voting.startElection(0);
      let all = await voting.getAllElections();
      // console.log('Election name:', all[0].name)
      expect(all[0].isActive).to.equal(true);

      await voting.endElection(0);
      all = await voting.getAllElections();
      expect(all[0].isActive).to.equal(false);
      expect(all[0].endedManually).to.equal(true);
    });
  });

  describe("stop/start election", function () {
    it("не дозволяє повторно запустити вибори після завершення", async function () {
      // Створення і запуск виборів
      await voting.createElection("Одноразові вибори", false, 0, [
        "Кандидат X",
      ]);

      // Запуск
      await voting.startElection(0);

      // Завершення
      await voting.endElection(0);

      // Спроба знову запустити вибори — має зафейлитись
      await expect(voting.startElection(0)).to.be.revertedWith(
        "Election has been already manually ended"
      );
    });
  });

  describe("vote", function () {
    beforeEach(async () => {
      await voting.createElection("Vote Test", true, 0, ["Кандидат"]);
    });

    it("Дозволяє голосування одному користувачу", async function () {
      await voting.connect(user1).vote(0, 0);
      const elections = await voting.getAllElections();
      expect(elections[0].candidates[0].voteCount).to.equal(1);
    });

    it("Не дозволяє голосувати двічі", async function () {
      await voting.connect(user1).vote(0, 0);
      await expect(voting.connect(user1).vote(0, 0)).to.be.revertedWith(
        "Already voted"
      );
    });

    it("Не дозволяє голосувати неактивні вибори", async function () {
      await voting.createElection("Інше", false, 0, ["Канд."]);
      await expect(voting.connect(user1).vote(1, 0)).to.be.revertedWith(
        "Election not active"
      );
    });

    it("Завершує вибори, якщо досягнуто ліміту голосів", async function () {
      await voting.createElection("Обмежене", true, 1, ["Канд"]);

      await voting.connect(user1).vote(1, 0);
      const all = await voting.getAllElections();
      expect(all[1].isActive).to.equal(false);
      expect(all[1].endedManually).to.equal(true);
    });
  });

  describe("getMyVote", function () {
    it("Повертає правильний статус голосування", async function () {
      await voting.createElection("Голосування", true, 0, ["Кандидат 1"]);

      const voteBefore = await voting.connect(user1).getMyVote(0);
      expect(voteBefore.hasVoted).to.equal(false);
      expect(voteBefore.candidateId).to.equal(ethers.MaxUint256);
      expect(voteBefore.candidateName).to.equal("");

      await voting.connect(user1).vote(0, 0);

      const voteAfter = await voting.connect(user1).getMyVote(0);
      expect(voteAfter.hasVoted).to.equal(true);
      expect(voteAfter.candidateId).to.equal(0);
      expect(voteAfter.candidateName).to.equal("Кандидат 1");
    });
  });

  describe("getResults", function () {
    it("Повертає результати після завершення виборів", async function () {
      await voting.createElection("Results", true, 1, ["A"]);
      await voting.connect(user1).vote(0, 0);

      const results = await voting.getResults(0);
      expect(results[0].name).to.equal("A");
      expect(results[0].voteCount).to.equal(1);
    });

    it("Не повертає результати до завершення", async function () {
      await voting.createElection("Not ended", true, 0, ["X"]);

      await expect(voting.getResults(0)).to.be.revertedWith(
        "Election not ended"
      );
    });
  });

  describe("voteWithSignature", function () {
    let electionId;
    let chainId, domain;
    const domainName = "VotingSystem";
    const domainVersion = "1";

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

    beforeEach(async () => {
      await voting.createElection("Підписне голосування", true, 0, ["Кандидат 1"]);
      electionId = 0;
      const { chainId: chain } = await ethers.provider.getNetwork();
      chainId = chain;

      domain = {
        name: domainName,
        version: domainVersion,
        chainId,
        verifyingContract: voting.target,
      };
    });

    it("Успішно голосує через підпис", async function () {
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

      // Голосує через підпис
      await voting
        .connect(user2)
        .voteWithSignature(
          electionId,
          candidateId,
          voterAddress,
          voteSignature,
          authSignature
        );

      const elections = await voting.getAllElections();
      expect(elections[electionId].candidates[candidateId].voteCount).to.equal(
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

      await voting
        .connect(owner)
        .voteWithSignature(
          electionId,
          candidateId,
          voterAddress,
          voteSignature,
          authSignature
        );

      // Повторне використання того ж підпису
      await expect(
        voting
          .connect(owner)
          .voteWithSignature(
            electionId,
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
        voting
          .connect(owner)
          .voteWithSignature(
            electionId,
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
        voting
          .connect(owner)
          .voteWithSignature(
            electionId,
            candidateId,
            user1.address,
            voteSignature,
            fakeAuthSignature
          )
      ).to.be.revertedWith("Not authorized by owner");
    });
  });
});
