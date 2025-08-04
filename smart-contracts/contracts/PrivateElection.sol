// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PublicElection.sol";

contract PrivateElection is PublicElection {

    function initialize(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately
    ) public override initializer {
        __EIP712_init("PrivateElection", "1");

        __BaseElection_init(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately
        );

    }

    function vote(
        uint256 candidateId
    ) external override electionOngoing {
        revert("You need to use authSignature");
    }

    function vote(
        uint256 candidateId,
        bytes memory authSignature
    ) external electionOngoing {
        bytes32 authHash = keccak256(
            abi.encode(AUTH_TYPEHASH, electionId, msg.sender)
        );

        bytes32 authDigest = _hashTypedDataV4(authHash);
        address authSigner = ECDSA.recover(authDigest, authSignature);
        require(authSigner == creator, "Not authorized by owner");

        _internalVote(candidateId, msg.sender);
    }

    function voteWithSignature(
        uint256 _candidateId,
        address _voter,
        bytes memory voterSignature
    ) external override {
        revert("You need to use authSignature");
    }

    function voteWithSignature(
        uint256 _candidateId,
        address _voter,
        bytes memory voterSignature,
        bytes memory authSignature
    ) external {
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

        bytes32 authHash = keccak256(
            abi.encode(AUTH_TYPEHASH, electionId, _voter)
        );

        bytes32 authDigest = _hashTypedDataV4(authHash);
        address authSigner = ECDSA.recover(authDigest, authSignature);
        require(authSigner == creator, "Not authorized by owner");

        _internalVote(_candidateId, _voter);
    }
}
