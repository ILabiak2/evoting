// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PublicElection.sol";
import "./PrivateElection.sol";
import {ElectionData} from "./interfaces/ElectionData.sol";
import {ElectionMetadata} from "./lib/ElectionMetadata.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract VotingFactory {
    address public admin;
    address public publicElectionImpl;
    address public privateElectionImpl;

constructor(address _publicElectionImpl, address _privateElectionImpl) {
    admin = msg.sender;
    publicElectionImpl = _publicElectionImpl;
    privateElectionImpl = _privateElectionImpl;
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

    struct FullElectionInfo {
        ElectionMetadata.ElectionWithCandidates coreData;
        ElectionType electionType;
        address contractAddress;
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
        // 1. Clone the PublicElection implementation
        address clone = Clones.clone(publicElectionImpl);

        // 2. Initialize the cloned contract
        PublicElection(clone).initialize(
            name,
            candidateNames,
            msg.sender,
            admin,
            electionCounter,
            _voterLimit,
            _startImmediately
        );

        // 3. Store metadata in your elections mapping
        elections[electionCounter] = ElectionInfo({
            contractAddress: clone,
            electionType: ElectionType.Public,
            name: name,
            creator: msg.sender
        });

        // 4. Emit creation event
        emit ElectionCreated(
            electionCounter,
            ElectionType.Public,
            name,
            clone,
            msg.sender
        );

        // 5. Increment counter
        electionCounter++;
    }

    function createPrivateElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately
    ) external {
        address clone = Clones.clone(privateElectionImpl);

        PrivateElection(clone).initialize(
            name,
            candidateNames,
            msg.sender,
            admin,
            electionCounter,
            _voterLimit,
            _startImmediately
        );

        elections[electionCounter] = ElectionInfo({
            contractAddress: clone,
            electionType: ElectionType.Public,
            name: name,
            creator: msg.sender
        });

        emit ElectionCreated(
            electionCounter,
            ElectionType.Public,
            name,
            clone,
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

    //     function getAllElections()
    //         external
    //         view
    //         returns (FullElectionInfo[] memory)
    //     {
    //         FullElectionInfo[] memory result = new FullElectionInfo[](
    //             electionCounter
    //         );
    //         for (uint256 i = 0; i < electionCounter; i++) {
    //             address electionAddr = elections[i].contractAddress;
    //             ElectionMetadata.ElectionWithCandidates memory core = ElectionData(
    //                 electionAddr
    //             ).getCoreElectionData();

    //             result[i] = FullElectionInfo({
    //                 coreData: core,
    //                 electionType: elections[i].electionType,
    //                 contractAddress: electionAddr
    //             });
    //         }
    //         return result;
    //     }

    //     function getActiveElections()
    //         external
    //         view
    //         returns (FullElectionInfo[] memory)
    //     {
    //         uint256 count;

    //         for (uint256 i = 0; i < electionCounter; i++) {
    //             address electionAddr = elections[i].contractAddress;
    //             if (ElectionData(electionAddr).getCoreElectionData().isActive) {
    //                 count++;
    //             }
    //         }

    //         FullElectionInfo[] memory result = new FullElectionInfo[](count);
    //         uint256 index;

    //         for (uint256 i = 0; i < electionCounter; i++) {
    //             address electionAddr = elections[i].contractAddress;
    //             ElectionMetadata.ElectionWithCandidates memory data = ElectionData(
    //                 electionAddr
    //             ).getCoreElectionData();

    //             if (data.isActive) {
    //                 result[index] = FullElectionInfo({
    //                     coreData: data,
    //                     electionType: elections[i].electionType,
    //                     contractAddress: electionAddr
    //                 });
    //                 index++;
    //             }
    //         }

    //         return result;
    //     }

    //     function getElectionsByIds(uint256[] memory ids) external view returns (FullElectionInfo[] memory) {
    //         FullElectionInfo[] memory temp = new FullElectionInfo[](ids.length);
    //         uint256 count = 0;

    //         for (uint256 i = 0; i < ids.length; i++) {
    //             uint256 id = ids[i];
    //             if (id >= electionCounter) {
    //                 continue;
    //             }

    //             address electionAddr = elections[id].contractAddress;
    //             ElectionMetadata.ElectionWithCandidates memory data = ElectionData(
    //                 electionAddr
    //             ).getCoreElectionData();

    //             temp[count] = FullElectionInfo({
    //                 coreData: data,
    //                 electionType: elections[id].electionType,
    //                 contractAddress: electionAddr
    //             });
    //             count++;
    //         }

    //         FullElectionInfo[] memory result = new FullElectionInfo[](count);
    //         for (uint256 i = 0; i < count; i++) {
    //             result[i] = temp[i];
    //         }
    //         return result;
    //     }

    function _buildFullElectionInfo(
        uint256 id
    ) internal view returns (FullElectionInfo memory) {
        address electionAddr = elections[id].contractAddress;
        ElectionMetadata.ElectionWithCandidates memory data = ElectionData(
            electionAddr
        ).getCoreElectionData();

        return
            FullElectionInfo({
                coreData: data,
                electionType: elections[id].electionType,
                contractAddress: electionAddr
            });
    }

    function getAllElections()
        external
        view
        returns (FullElectionInfo[] memory)
    {
        FullElectionInfo[] memory result = new FullElectionInfo[](
            electionCounter
        );
        for (uint256 i = 0; i < electionCounter; i++) {
            result[i] = _buildFullElectionInfo(i);
        }
        return result;
    }

    function getActiveElections()
        external
        view
        returns (FullElectionInfo[] memory)
    {
        // First, count how many are active
        uint256 activeCount = 0;
        for (uint256 i = 0; i < electionCounter; i++) {
            if (
                ElectionData(elections[i].contractAddress)
                    .getCoreElectionData()
                    .isActive
            ) {
                activeCount++;
            }
        }

        // Then collect them
        FullElectionInfo[] memory result = new FullElectionInfo[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < electionCounter; i++) {
            address addr = elections[i].contractAddress;
            if (ElectionData(addr).getCoreElectionData().isActive) {
                result[idx] = _buildFullElectionInfo(i);
                idx++;
            }
        }
        return result;
    }

    function getElectionsByIds(
        uint256[] memory ids
    ) external view returns (FullElectionInfo[] memory) {
        FullElectionInfo[] memory temp = new FullElectionInfo[](ids.length);
        uint256 count = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (id < electionCounter) {
                temp[count] = _buildFullElectionInfo(id);
                count++;
            }
        }

        // Shrink array
        FullElectionInfo[] memory result = new FullElectionInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }
}
