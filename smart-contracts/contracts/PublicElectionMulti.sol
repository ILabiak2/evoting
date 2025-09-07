// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import "./BaseElection.sol";

contract PublicElectionMulti is BaseElection, EIP712Upgradeable {
    bool private initialized;
    // uint256 public maxChoicesPerVoter;

    function initialize(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately,
        uint256 _maxChoicesPerVoter
    ) external virtual initializer {
        require(!initialized, "Already initialized");
        require(_maxChoicesPerVoter > 1, "maxChoices must be > 1");
        initialized = true;

        __BaseElection_init(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately,
            _maxChoicesPerVoter
        );

        __EIP712_init("PublicElectionMulti", "1");
        // maxChoicesPerVoter = _maxChoicesPerVoter;
    }

    struct Vote {
      uint256 electionId;
      uint256[] candidateIds;
      address voter;
    }

    bytes32 public constant VOTE_MULTI_TYPEHASH =
        keccak256(
            "Vote(uint256 electionId,uint256[] candidateIds,address voter)"
        );

    // ------------ Core voting logic ------------
    /**
     * @dev BaseElection expects this signature, but this contract is multi-choice.
     *      We forbid the single-candidate path to avoid confusion.
     */
    function _internalVote(
        uint256 /*_candidateId*/,
        address /*_voter*/
    ) internal pure override {
        revert("Use multi-choice vote");
    }

    function _internalMultiVote(
        uint256[] memory _candidateIds,
        address _voter
    ) internal {
        require(_voter != creator, "Creator cannot vote");
        if (endTime > 0 && block.timestamp > endTime) {
            isActive = false;
            ended = true;
            // revert("Election has ended");
            emit ElectionEnded((electionId));
            return;
        }
        require(isActive && !ended, "Election is not active");
        require(!hasVoted[_voter], "Already voted");
        uint256 n = _candidateIds.length;
        require(n > 0, "No candidates selected");
        require(n <= maxChoicesPerVoter, "You cannot select more candidates than allowed");

        if (voterLimit > 0) {
            require(voterCount < voterLimit, "Voter limit reached");
        }

        bool[] memory seen = new bool[](candidates.length);
        for (uint256 i = 0; i < n; i++) {
            uint256 cid = _candidateIds[i];
            require(cid < candidates.length, "Invalid candidate");
            require(!seen[cid], "Duplicate candidate in selection");
            seen[cid] = true;
        }

        for (uint256 i = 0; i < n; i++) {
            uint256 cid = _candidateIds[i];
            candidates[cid].voteCount += 1;
            emit VoteCast(electionId, cid, _voter);
        }

        hasVoted[_voter] = true;
        for (uint256 i = 0; i < n; i++) {
            votedCandidates[_voter].push(_candidateIds[i]);
        }
        voterCount += 1;
        electionVoters.push(_voter);

        // Якщо ліміт досягнуто — завершуємо
        if (voterLimit > 0 && voterCount >= voterLimit) {
            isActive = false;
            ended = true;
            endTime = block.timestamp;
            emit ElectionEnded(electionId);
        }
    }

    function vote(
        uint256[] calldata candidateIds
    ) external virtual electionOngoing {
        _internalMultiVote(_toMemory(candidateIds), msg.sender);
    }

    function voteWithSignature(
        uint256[] calldata _candidateIds,
        address _voter,
        bytes memory voterSignature
    ) external virtual {
        // Vote memory voteData = Vote({
        //     electionId: electionId,
        //     candidateIds: _candidateIds,
        //     voter: _voter
        // });
        bytes32 candidateIdsHash = keccak256(abi.encodePacked(_candidateIds));

        bytes32 structHash = keccak256(
            abi.encode(VOTE_MULTI_TYPEHASH, electionId, candidateIdsHash, _voter)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, voterSignature);
        require(signer == _voter, "Invalid signature");

        _internalMultiVote(_toMemory(_candidateIds), _voter);
    }

    function _toMemory(
        uint256[] calldata arr
    ) internal pure returns (uint256[] memory out) {
        out = new uint256[](arr.length);
        for (uint256 i = 0; i < arr.length; i++) out[i] = arr[i];
    }

}
