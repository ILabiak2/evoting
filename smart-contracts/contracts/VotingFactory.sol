// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PublicElection.sol";
import "./PrivateElection.sol";
import {ElectionData} from "./interfaces/ElectionData.sol";
import {ElectionMetadata} from "./lib/ElectionMetadata.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract VotingFactory is EIP712 {
    address public admin;
    address public publicElectionImpl;
    address public privateElectionImpl;

    constructor(
        address _publicElectionImpl,
        address _privateElectionImpl
    ) EIP712("VotingFactory", "1") {
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

    bytes32 public constant PUBLIC_ELECTION_TYPEHASH =
        keccak256(
            "Election(string name,bool startImmediately,uint256 voterLimit,address creator)"
        );

    bytes32 public constant PRIVATE_ELECTION_TYPEHASH =
        keccak256(
            "Election(string name,bool startImmediately,uint256 voterLimit,address creator)"
        );

    event ElectionCreated(
        uint256 indexed id,
        ElectionType electionType,
        string name,
        address contractAddress,
        address creator
    );

    function _createElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately,
        address _creator,
        ElectionType implType
    ) internal returns (address) {
        address clone;
        ElectionType electionType;

        if (implType == ElectionType.Public) {
            clone = Clones.clone(publicElectionImpl);
            PublicElection(clone).initialize(
                name,
                candidateNames,
                _creator,
                admin,
                electionCounter,
                _voterLimit,
                _startImmediately
            );
            electionType = ElectionType.Public;
        } else if (implType == ElectionType.Private) {
            clone = Clones.clone(privateElectionImpl);
            PrivateElection(clone).initialize(
                name,
                candidateNames,
                _creator,
                admin,
                electionCounter,
                _voterLimit,
                _startImmediately
            );
            electionType = ElectionType.Private;
        }

        elections[electionCounter] = ElectionInfo({
            contractAddress: clone,
            electionType: electionType,
            name: name,
            creator: _creator
        });

        emit ElectionCreated(
            electionCounter,
            electionType,
            name,
            clone,
            _creator
        );

        electionCounter++;
        return clone;
    }

    function createPublicElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately
    ) external returns (address) {
        return _createElection(
            name,
            candidateNames,
            _voterLimit,
            _startImmediately,
            msg.sender,
            ElectionType.Public
        );
    }

    function createPublicElectionWithSignature(
        string memory name,
        bool _startImmediately,
        uint256 _voterLimit,
        address _creator,
        string[] memory candidateNames,
        bytes memory signature
    ) external returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                PUBLIC_ELECTION_TYPEHASH,
                keccak256(bytes(name)),
                _startImmediately,
                _voterLimit,
                _creator
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        require(signer == _creator, "Invalid signature");

        return
            _createElection(
                name,
                candidateNames,
                _voterLimit,
                _startImmediately,
                _creator,
                ElectionType.Public
            );
    }

    function createPrivateElection(
        string memory name,
        string[] memory candidateNames,
        uint256 _voterLimit,
        bool _startImmediately
    ) external returns (address) {
        return
            _createElection(
                name,
                candidateNames,
                _voterLimit,
                _startImmediately,
                msg.sender,
                ElectionType.Private
            );
    }

    function createPrivateElectionWithSignature(
        string memory name,
        bool _startImmediately,
        uint256 _voterLimit,
        address _creator,
        string[] memory candidateNames,
        bytes memory signature
    ) external returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                PRIVATE_ELECTION_TYPEHASH,
                keccak256(bytes(name)),
                _startImmediately,
                _voterLimit,
                _creator
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        require(signer == _creator, "Invalid signature");

        return
            _createElection(
                name,
                candidateNames,
                _voterLimit,
                _startImmediately,
                _creator,
                ElectionType.Private
            );
    }

    function getElection(
        uint256 id
    ) external view returns (ElectionInfo memory) {
        require(id < electionCounter, "Invalid election ID");
        return elections[id];
    }

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

        FullElectionInfo[] memory result = new FullElectionInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        return result;
    }

    function getMyElections()
        external
        view
        returns (FullElectionInfo[] memory)
    {
        FullElectionInfo[] memory temp = new FullElectionInfo[](
            electionCounter
        );
        uint256 count = 0;

        for (uint256 i = 0; i < electionCounter; i++) {
            if (elections[i].creator == msg.sender) {
                temp[count] = _buildFullElectionInfo(i);
                count++;
            }
        }

        FullElectionInfo[] memory result = new FullElectionInfo[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }

        return result;
    }
}
