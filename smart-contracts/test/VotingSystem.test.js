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
      await voting.createElection("Голосування 1", true, 0);
      const elections = await voting.getAllElections();

      expect(elections.length).to.equal(1);
      expect(elections[0].name).to.equal("Голосування 1");
      expect(elections[0].isActive).to.equal(true);
      expect(elections[0].startedManually).to.equal(true);
    });

    it("Створює голосування без старту", async function () {
      await voting.createElection("Голосування 2", false, 100);
      const elections = await voting.getAllElections();
      console.log(elections[0])
      expect(elections.length).to.equal(1);
      expect(elections[0].isActive).to.equal(false);
      expect(elections[0].voterLimit).to.equal(100);
    });
  });

  describe("addCandidate", function () {
    it("Додає кандидатів до виборів", async function () {
      await voting.createElection("Test", true, 0);
      await voting.addCandidate(0, "Кандидат 1");
      await voting.addCandidate(0, "Кандидат 2");

      const all = await voting.getAllElections();
      expect(all[0].candidateCount).to.equal(2);
      expect(all[0].candidates[0].name).to.equal("Кандидат 1");
      expect(all[0].candidates[1].name).to.equal("Кандидат 2");
    });

    it("Забороняє додавати більше ніж MAX_CANDIDATES", async function () {
      await voting.createElection("Test", true, 0);

      for (let i = 0; i < 100; i++) {
        await voting.addCandidate(0, `Канд. ${i}`);
      }

      await expect(
        voting.addCandidate(0, "Перевищення")
      ).to.be.revertedWith("Max candidates");
    });
  });

  describe("startElection / endElection", function () {
    it("Запускає і завершує голосування", async function () {
      await voting.createElection("Тест", false, 0);
      await voting.startElection(0);
      let all = await voting.getAllElections();
      console.log('Election name:', all[0].name)
      expect(all[0].isActive).to.equal(true);

      await voting.endElection(0);
      all = await voting.getAllElections();
      expect(all[0].isActive).to.equal(false);
      expect(all[0].endedManually).to.equal(true);
    });
  });

  describe("vote", function () {
    beforeEach(async () => {
      await voting.createElection("Vote Test", true, 0);
      await voting.addCandidate(0, "Кандидат");
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
      await voting.createElection("Інше", false, 0);
      await voting.addCandidate(1, "Канд.");
      await expect(voting.connect(user1).vote(1, 0)).to.be.revertedWith(
        "Election not active"
      );
    });

    it("Завершує вибори, якщо досягнуто ліміту голосів", async function () {
      await voting.createElection("Обмежене", true, 1);
      await voting.addCandidate(1, "Канд");

      await voting.connect(user1).vote(1, 0);
      const all = await voting.getAllElections();
      expect(all[1].isActive).to.equal(false);
      expect(all[1].endedManually).to.equal(true);
    });
  });

  describe("getMyVote", function () {
    it("Повертає правильний статус голосування", async function () {
      await voting.createElection("Голосування", true, 0);
      await voting.addCandidate(0, "Кандидат");

      const voteBefore = await voting.connect(user1).getMyVote(0);
      expect(voteBefore.hasVoted).to.equal(false);

      await voting.connect(user1).vote(0, 0);

      const voteAfter = await voting.connect(user1).getMyVote(0);
      expect(voteAfter.hasVoted).to.equal(true);
      expect(voteAfter.candidateId).to.equal(0);
    });
  });

  describe("getResults", function () {
    it("Повертає результати після завершення виборів", async function () {
      await voting.createElection("Results", true, 1);
      await voting.addCandidate(0, "A");
      await voting.connect(user1).vote(0, 0);

      const results = await voting.getResults(0);
      expect(results[0].name).to.equal("A");
      expect(results[0].voteCount).to.equal(1);
    });

    it("Не повертає результати до завершення", async function () {
      await voting.createElection("Not ended", true, 0);
      await voting.addCandidate(0, "X");

      await expect(voting.getResults(0)).to.be.revertedWith(
        "Election not ended"
      );
    });
  });
});