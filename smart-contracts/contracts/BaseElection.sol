// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./lib/ElectionMetadata.sol";

abstract contract BaseElection {
    uint256 public constant MAX_CANDIDATES = 100;

    uint256 public electionId;
    string public name;
    address public creator;
    address public admin;

    uint256 public startTime;
    uint256 public endTime;
    bool public isActive;
    bool public started;
    bool public ended;
    uint256 public voterLimit;
    uint256 public voterCount;
    uint256 public createdAt;
    uint256 public maxChoicesPerVoter;

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    address[] public electionVoters;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256[]) public votedCandidates;
    mapping(bytes32 => bool) internal candidateNameExists;

    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event VoteCast(
        uint256 indexed electionId,
        uint256 candidateId,
        address voter
    );
    event CandidateRenamed(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string oldName,
        string newName
    );
    event CandidateRemoved(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name
    );
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name
    );
    event ElectionRenamed(
        uint256 indexed electionId,
        string oldName,
        string newName
    );
    event EndTimeUpdated(
        uint256 indexed electionId,
        uint256 oldEndTime,
        uint256 newEndTime
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }

    modifier onlyCreatorOrAdmin(uint256 _electionId) {
        require(
            msg.sender == creator || msg.sender == admin,
            "Not creator or admin"
        );
        _;
    }

    modifier electionOngoing() {
        require(isElectionActive(), "Election is not active");
        _;
    }

    modifier onlyBeforeStart() {
        require(
            !isActive && startTime == 0 && endTime == 0,
            "Election already started"
        );
        _;
    }

    function __BaseElection_init(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately,
        uint256 _maxChoicesPerVoter
    ) internal {
        name = _name;
        admin = _admin;
        creator = _creator;
        electionId = _electionId;
        voterLimit = _voterLimit;
        maxChoicesPerVoter = _maxChoicesPerVoter;
        createdAt = block.timestamp;

        if (_startImmediately) {
            startTime = block.timestamp;
            isActive = true;
            started = true;
        } else {
            startTime = 0;
            isActive = false;
            started = false;
        }

        endTime = 0;

        _addCandidates(_candidateNames);
    }

    function _addCandidates(string[] memory _names) internal {
        uint256 namesLength = _names.length;

        require(
            candidates.length + namesLength <= MAX_CANDIDATES,
            "Exceeds max candidates"
        );

        for (uint256 i = 0; i < namesLength; i++) {
            bytes32 nameHash = keccak256(abi.encodePacked(_names[i]));
            require(!candidateNameExists[nameHash], "Duplicate candidate name");

            candidates.push(
                Candidate({
                    id: candidates.length,
                    name: _names[i],
                    voteCount: 0
                })
            );

            candidateNameExists[nameHash] = true;
            emit CandidateAdded(electionId, candidates.length - 1, _names[i]);
        }
    }

    function addCandidates(
        string[] memory _names
    ) external virtual onlyCreatorOrAdmin(electionId) onlyBeforeStart {
        _addCandidates(_names);
    }

    function editCandidateName(
        uint256 candidateId,
        string calldata newName
    ) external virtual onlyCreatorOrAdmin(electionId) onlyBeforeStart {
        require(candidateId < candidates.length, "Invalid candidate");
        require(bytes(newName).length > 0, "Empty name");

        Candidate storage c = candidates[candidateId];

        if (keccak256(bytes(c.name)) == keccak256(bytes(newName))) {
            return;
        }

        bytes32 oldHash = keccak256(abi.encodePacked(c.name));
        bytes32 newHash = keccak256(abi.encodePacked(newName));
        require(!candidateNameExists[newHash], "Duplicate candidate name");

        candidateNameExists[oldHash] = false;
        candidateNameExists[newHash] = true;

        string memory oldName = c.name;
        c.name = newName;

        emit CandidateRenamed(electionId, candidateId, oldName, newName);
    }

    function editElectionName(
        string calldata newName
    ) external onlyCreatorOrAdmin(electionId) onlyBeforeStart {
        require(bytes(newName).length > 0, "Empty name");
        if (keccak256(bytes(name)) == keccak256(bytes(newName))) {
            return;
        }
        string memory oldName = name;
        name = newName;
        emit ElectionRenamed(electionId, oldName, newName);
    }

    function removeCandidate(
        uint256 candidateId
    ) external virtual onlyCreatorOrAdmin(electionId) onlyBeforeStart {
        require(candidateId < candidates.length, "Invalid candidate");

        Candidate memory c = candidates[candidateId];
        bytes32 nameHash = keccak256(abi.encodePacked(c.name));
        candidateNameExists[nameHash] = false;
        emit CandidateRemoved(electionId, candidateId, c.name);

        for (uint256 i = candidateId; i < candidates.length - 1; i++) {
            candidates[i] = candidates[i + 1];
            candidates[i].id = i;
        }

        candidates.pop();
    }

    function isElectionActive() public view returns (bool) {
        if (ended) return false;
        if (started && endTime != 0) {
            return block.timestamp <= endTime;
        }
        return isActive;
    }

    function startElection() external onlyCreatorOrAdmin(electionId) {
        require(!isActive, "Already active");
        require(!ended, "Election has already ended");
        isActive = true;
        started = true;
        startTime = block.timestamp;
        emit ElectionStarted(electionId);
    }

    function endElection() external onlyCreatorOrAdmin(electionId) {
        require(isActive, "Election is not active");
        isActive = false;
        ended = true;
        endTime = block.timestamp;
        emit ElectionEnded(electionId);
    }

    function setEndTime(
        uint256 newEndTime
    ) external onlyCreatorOrAdmin(electionId) {
        require(!ended, "Election already ended");
        require(
            newEndTime == 0 || newEndTime > block.timestamp,
            "End must be in the future or zero"
        );

        uint256 old = endTime;
        endTime = newEndTime;

        emit EndTimeUpdated(electionId, old, newEndTime);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getVotedCandidateIds(
        address user
    ) external view returns (uint256[] memory) {
        return votedCandidates[user];
    }

    function getCoreElectionData()
        external
        view
        returns (ElectionMetadata.ElectionWithCandidates memory)
    {
        ElectionMetadata.CandidateView[]
            memory list = new ElectionMetadata.CandidateView[](
                candidates.length
            );

        for (uint256 i = 0; i < candidates.length; i++) {
            Candidate storage c = candidates[i];
            list[i] = ElectionMetadata.CandidateView(c.id, c.name, c.voteCount);
        }

        return
            ElectionMetadata.ElectionWithCandidates({
                id: electionId,
                name: name,
                createdAt: createdAt,
                creator: creator,
                startTime: startTime,
                endTime: endTime,
                isActive: isActive,
                started: started,
                ended: ended,
                candidateCount: candidates.length,
                voterLimit: voterLimit,
                maxChoicesPerVoter: maxChoicesPerVoter,
                candidates: list
            });
    }

    function _internalVote(
        uint256 _candidateId,
        address _voter
    ) internal virtual;


    function recoverSigner(
        bytes32 _ethSignedMessageHash,
        bytes memory _sig
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_sig);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Bad signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
