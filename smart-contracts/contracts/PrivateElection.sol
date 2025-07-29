// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "./PublicElection.sol";

contract PrivateElection is PublicElection {
        constructor(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately
    )
        PublicElection(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately
        )
    {}
}