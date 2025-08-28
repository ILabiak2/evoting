// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

import "./PublicElectionMulti.sol";

contract PrivateElectionMulti is PublicElectionMulti {
    bytes32 public constant AUTH_TYPEHASH =
        keccak256("Auth(uint256 electionId,address voter)");

    function initialize(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately,
        uint256 _maxChoicesPerVoter
    ) public override initializer {
        __BaseElection_init(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately
        );
        __EIP712_init("PrivateElectionMulti", "1");
        require(_maxChoicesPerVoter > 0, "maxChoices must be > 0");
        maxChoicesPerVoter = _maxChoicesPerVoter;
    }

    function vote(uint256[] calldata /*candidateIds*/) external pure override {
        revert("You need to use authSignature");
    }

    function vote(
        uint256[] calldata candidateIds,
        bytes calldata authSignature
    ) external electionOngoing {
        bytes32 authHash = keccak256(
            abi.encode(AUTH_TYPEHASH, electionId, msg.sender)
        );
        bytes32 authDigest = _hashTypedDataV4(authHash);
        address authSigner = ECDSA.recover(authDigest, authSignature);
        require(authSigner == creator, "Not authorized by owner");

        _internalMultiVote(_toMemory(candidateIds), msg.sender);
    }

    function voteWithSignature(
        uint256[] calldata /*candidateIds*/,
        address /*_voter*/,
        bytes calldata /*voterSignature*/
    ) external pure override {
        revert("You need to use authSignature");
    }

    function voteWithSignature(
        uint256[] calldata candidateIds,
        address voter,
        bytes calldata voterSignature,
        bytes calldata authSignature
    ) external {
        bytes32 candidateIdsHash = keccak256(abi.encodePacked(candidateIds));

        bytes32 structHash = keccak256(
            abi.encode(VOTE_MULTI_TYPEHASH, electionId, candidateIdsHash, voter)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, voterSignature);
        require(signer == voter, "Invalid signature");

        bytes32 authHash = keccak256(
            abi.encode(AUTH_TYPEHASH, electionId, voter)
        );
        bytes32 authDigest = _hashTypedDataV4(authHash);
        address authSigner = ECDSA.recover(authDigest, authSignature);
        require(authSigner == creator, "Not authorized by owner");

        _internalMultiVote(_toMemory(candidateIds), voter);
    }
}
