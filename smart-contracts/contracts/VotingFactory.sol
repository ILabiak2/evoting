// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PublicElection.sol";
import "./PrivateElection.sol";
import {ElectionData} from "./interfaces/ElectionData.sol";
import {ElectionMetadata} from "./lib/ElectionMetadata.sol";

contract VotingFactory {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    enum ElectionType {
        Public,
        Private
    }

    struct ElectionInfo {
        address contractAddress;
        ElectionType electionType;
        string name;
        address creator;
    }

    uint256 public electionCounter;
    mapping(uint256 => ElectionInfo) public elections;

    event ElectionCreated(
        uint256 indexed id,
        ElectionType electionType,
        string name,
        address contractAddress,
        address creator
    );

    function createPublicElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately
    ) external {
        PublicElection election = new PublicElection(
            name,
            candidateNames,
            msg.sender,
            admin,
            electionCounter,
            _voterLimit,
            _startImmediately
        );

        elections[electionCounter] = ElectionInfo({
            contractAddress: address(election),
            electionType: ElectionType.Public,
            name: name,
            creator: msg.sender
        });

        emit ElectionCreated(
            electionCounter,
            ElectionType.Public,
            name,
            address(election),
            msg.sender
        );

        electionCounter++;
    }

    function createPrivateElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately
    ) external {
        PrivateElection election = new PrivateElection(
            name,
            candidateNames,
            msg.sender,
            admin,
            electionCounter,
            _voterLimit,
            _startImmediately
        );

        elections[electionCounter] = ElectionInfo({
            contractAddress: address(election),
            electionType: ElectionType.Private,
            name: name,
            creator: msg.sender
        });

        emit ElectionCreated(
            electionCounter,
            ElectionType.Private,
            name,
            address(election),
            msg.sender
        );

        electionCounter++;
    }

    function getElection(
        uint256 id
    ) external view returns (ElectionInfo memory) {
        require(id < electionCounter, "Invalid election ID");
        return elections[id];
    }

    function getAllElections()
        external
        view
        returns (ElectionMetadata.ElectionWithCandidates[] memory)
    {
        ElectionMetadata.ElectionWithCandidates[]
            memory result = new ElectionMetadata.ElectionWithCandidates[](
                electionCounter
            );
        for (uint256 i = 0; i < electionCounter; i++) {
            address electionAddr = elections[i].contractAddress;
            result[i] = ElectionData(electionAddr).getCoreElectionData();
        }
        return result;
    }

    function getActiveElections()
        external
        view
        returns (ElectionMetadata.ElectionWithCandidates[] memory)
    {
    uint256 count;

    for (uint256 i = 0; i < electionCounter; i++) {
        address electionAddr = elections[i].contractAddress;
        if (ElectionData(electionAddr).getCoreElectionData().isActive) {
            count++;
        }
    }

    ElectionMetadata.ElectionWithCandidates[] memory result = new ElectionMetadata.ElectionWithCandidates[](count);
    uint256 index;

    for (uint256 i = 0; i < electionCounter; i++) {
        address electionAddr = elections[i].contractAddress;
        ElectionMetadata.ElectionWithCandidates memory data = ElectionData(electionAddr).getCoreElectionData();

        if (data.isActive) {
            result[index] = data;
            index++;
        }
    }

    return result;
    }
}
