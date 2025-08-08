// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import "./BaseElection.sol";

contract PublicElection is BaseElection, EIP712Upgradeable {
    bool private initialized;

    function initialize(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately
    ) external virtual initializer {
        require(!initialized, "Already initialized");
        initialized = true;

        __BaseElection_init(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately
        );

        __EIP712_init("PublicElection", "1");
    }

    struct Vote {
        uint256 electionId;
        uint256 candidateId;
        address voter;
    }

    bytes32 public constant VOTE_TYPEHASH =
        keccak256("Vote(uint256 electionId,uint256 candidateId,address voter)");
    bytes32 public constant AUTH_TYPEHASH =
        keccak256("Auth(uint256 electionId,address voter)");

    // ------------------------
    // Voting Logic
    // ------------------------

    function _internalVote(
        uint256 _candidateId,
        address _voter
    ) internal override {
        require(_voter != creator, "Creator cannot vote");
        require(isActive && !endedManually, "Election not active");
        require(!hasVoted[_voter], "Already voted");
        require(_candidateId < candidates.length, "Invalid candidate");

        if (voterLimit > 0) {
            require(voterCount < voterLimit, "Voter limit reached");
        }

        candidates[_candidateId].voteCount++;
        hasVoted[_voter] = true;
        votedCandidates[_voter].push(_candidateId);
        voterCount++;
        electionVoters.push(_voter);

        // Якщо ліміт досягнуто — завершуємо
        if (voterLimit > 0 && voterCount >= voterLimit) {
            isActive = false;
            endedManually = true;
            endTime = block.timestamp;
            emit ElectionEnded(electionId);
        }

        emit VoteCast(electionId, _candidateId, _voter);
    }

    function vote(uint256 candidateId) external virtual electionOngoing {
        _internalVote(candidateId, msg.sender);
    }

    function voteWithSignature(
        uint256 _candidateId,
        address _voter,
        bytes memory voterSignature
    ) external virtual {
        Vote memory voteData = Vote({
            electionId: electionId,
            candidateId: _candidateId,
            voter: _voter
        });

        bytes32 structHash = keccak256(
            abi.encode(
                VOTE_TYPEHASH,
                voteData.electionId,
                voteData.candidateId,
                voteData.voter
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(digest, voterSignature);
        require(signer == _voter, "Invalid signature");

        _internalVote(_candidateId, _voter);
    }

    // ------------------------
    // Getters
    // ------------------------

    function getMyVote()
        external
        view
        returns (
            bool userVoted,
            uint256 candidateId,
            string memory candidateName
        )
    {
        userVoted = hasVoted[msg.sender];

        if (userVoted) {
            candidateId = votedCandidates[msg.sender][0];
            candidateName = candidates[candidateId].name;
        } else {
            candidateId = type(uint256).max; // Спеціальне значення "не проголосував"
            candidateName = "";
        }

        return (userVoted, candidateId, candidateName);
    }

    function _getCandidates() internal view returns (Candidate[] memory) {
        Candidate[] memory result = new Candidate[](candidates.length);
        for (uint256 i = 0; i < candidates.length; i++) {
            result[i] = candidates[i];
        }
        return result;
    }

    function getResults() external view returns (Candidate[] memory) {
        require(
            endedManually ||
                (endTime > 0 && block.timestamp > endTime) ||
                (voterLimit > 0 && voterCount >= voterLimit),
            "Election has not ended yet"
        );
        return _getCandidates();
    }
}
