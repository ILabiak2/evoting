// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract VotingSystem is EIP712 {
    address public admin;
    uint256 public electionCounter;
    uint256 public constant MAX_CANDIDATES = 100;

    constructor() EIP712("VotingSystem", "1") {
        admin = msg.sender;
    }

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        address creator;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 voterLimit; // 0 = необмежено
        bool startedManually;
        bool endedManually;
        bool isActive;
        uint256 candidateCount;
        uint256 voterCount;
        mapping(uint256 => Candidate) candidates;
        mapping(bytes32 => bool) candidateNameExists;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votedCandidate; // для перевірки голосу
    }

    struct ElectionView {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool startedManually;
        bool endedManually;
        uint256 candidateCount;
    }

    struct CandidateView {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct ElectionWithCandidates {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool startedManually;
        bool endedManually;
        uint256 candidateCount;
        uint256 voterLimit;
        CandidateView[] candidates;
    }

    struct Vote {
        uint256 electionId;
        uint256 candidateId;
        address voter;
    }

    bytes32 private constant VOTE_TYPEHASH =
        keccak256("Vote(uint256 electionId,uint256 candidateId,address voter)");
    bytes32 constant AUTH_TYPEHASH =
        keccak256("Auth(uint256 electionId,address voter)");

    mapping(uint256 => Election) public elections;
    mapping(uint256 => address[]) internal electionVoters;

    // Events
    event ElectionCreated(uint256 indexed electionId, string name);
    event ElectionStarted(uint256 indexed electionId);
    event ElectionEnded(uint256 indexed electionId);
    event VoteCast(
        uint256 indexed electionId,
        uint256 candidateId,
        address voter
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyCreatorOrAdmin(uint256 _electionId) {
        Election storage e = elections[_electionId];
        require(
            msg.sender == e.creator || msg.sender == admin,
            "Not creator or admin"
        );
        _;
    }

    modifier validElection(uint256 _electionId) {
        require(_electionId < electionCounter, "Invalid election");
        _;
    }

    // === ADMIN ACTIONS ===

    function createElection(
        string memory _name,
        bool _startImmediately,
        uint256 _voterLimit
    ) external {
        Election storage e = elections[electionCounter];
        e.id = electionCounter;
        e.creator = msg.sender;
        e.name = _name;
        e.voterLimit = _voterLimit;

        if (_startImmediately) {
            e.startTime = block.timestamp;
            e.isActive = true;
            e.startedManually = true;
        } else {
            e.startTime = 0;
            e.isActive = false;
        }

        e.endTime = 0; // Not set at creation

        emit ElectionCreated(electionCounter, _name);
        electionCounter++;
    }

    function addCandidate(
        uint256 _electionId,
        string memory _name
    ) external onlyCreatorOrAdmin(_electionId) validElection(_electionId) {
        Election storage e = elections[_electionId];
        require(e.candidateCount < MAX_CANDIDATES, "Max candidates");

        bytes32 nameHash = keccak256(abi.encodePacked(_name));
        require(
            !e.candidateNameExists[nameHash],
            "Candidate name already exists"
        );

        e.candidates[e.candidateCount] = Candidate(e.candidateCount, _name, 0);
        e.candidateNameExists[nameHash] = true;
        e.candidateCount++;
    }

    function startElection(
        uint256 _electionId
    ) external validElection(_electionId) onlyCreatorOrAdmin(_electionId) {
        Election storage e = elections[_electionId];
        require(!e.isActive, "Already is active");
        require(!e.endedManually, "Election has been already manually ended");
        e.isActive = true;
        e.startedManually = true;
        e.startTime = block.timestamp;
        emit ElectionStarted(_electionId);
    }

    function endElection(
        uint256 _electionId
    ) external validElection(_electionId) onlyCreatorOrAdmin(_electionId) {
        Election storage e = elections[_electionId];
        require(e.isActive, "Election is not active");
        e.isActive = false;
        e.endedManually = true;
        e.endTime = block.timestamp;
        emit ElectionEnded(_electionId);
    }

    // === VOTING ===

    function vote(
        uint256 _electionId,
        uint256 _candidateId
    ) external validElection(_electionId) {
        _internalVote(_electionId, _candidateId, msg.sender);
    }

    function voteWithSignature(
        uint256 _electionId,
        uint256 _candidateId,
        address _voter,
        bytes memory voterSignature,
        bytes memory authSignature
    ) external validElection(_electionId) {
        Vote memory voteData = Vote({
            electionId: _electionId,
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
            abi.encode(AUTH_TYPEHASH, _electionId, _voter)
        );

        bytes32 authDigest = _hashTypedDataV4(authHash);
        address authSigner = ECDSA.recover(authDigest, authSignature);
        require(
            authSigner == elections[_electionId].creator,
            "Not authorized by owner"
        );

        _internalVote(_electionId, _candidateId, _voter);
    }

    function _internalVote(
        uint256 _electionId,
        uint256 _candidateId,
        address _voter
    ) internal {
        Election storage e = elections[_electionId];

        require(e.isActive && !e.endedManually, "Election not active");
        require(!e.hasVoted[_voter], "Already voted");
        require(_candidateId < e.candidateCount, "Invalid candidate");

        if (e.voterLimit > 0) {
            require(e.voterCount < e.voterLimit, "Voter limit reached");
        }

        e.candidates[_candidateId].voteCount++;
        e.hasVoted[_voter] = true;
        e.votedCandidate[_voter] = _candidateId;
        e.voterCount++;
        electionVoters[_electionId].push(_voter);

        // Якщо ліміт досягнуто — завершуємо
        if (e.voterLimit > 0 && e.voterCount >= e.voterLimit) {
            e.isActive = false;
            e.endedManually = true;
            e.endTime = block.timestamp;
            emit ElectionEnded(_electionId);
        }

        emit VoteCast(_electionId, _candidateId, _voter);
    }

    // === GETTERS ===

    function getMyVote(
        uint256 _electionId
    )
        external
        view
        validElection(_electionId)
        returns (
            bool hasVoted,
            uint256 candidateId,
            string memory candidateName
        )
    {
        Election storage e = elections[_electionId];
        hasVoted = e.hasVoted[msg.sender];

        if (hasVoted) {
            candidateId = e.votedCandidate[msg.sender];
            candidateName = e.candidates[candidateId].name;
        } else {
            candidateId = type(uint256).max; // Спеціальне значення "не проголосував"
            candidateName = "";
        }
    }

    function getActiveElections()
        external
        view
        returns (ElectionWithCandidates[] memory)
    {
        // Підрахунок кількості активних виборів
        uint256 activeCount = 0;
        for (uint256 i = 0; i < electionCounter; i++) {
            Election storage e = elections[i];
            if (e.isActive && !e.endedManually) {
                activeCount++;
            }
        }

        // Формуємо результат
        ElectionWithCandidates[] memory result = new ElectionWithCandidates[](
            activeCount
        );
        uint256 idx = 0;

        for (uint256 i = 0; i < electionCounter; i++) {
            Election storage e = elections[i];
            if (e.isActive && !e.endedManually) {
                CandidateView[] memory candidates = new CandidateView[](
                    e.candidateCount
                );

                for (uint256 j = 0; j < e.candidateCount; j++) {
                    Candidate storage c = e.candidates[j];
                    candidates[j] = CandidateView({
                        id: c.id,
                        name: c.name,
                        voteCount: c.voteCount
                    });
                }

                result[idx++] = ElectionWithCandidates({
                    id: e.id,
                    name: e.name,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    isActive: e.isActive,
                    startedManually: e.startedManually,
                    endedManually: e.endedManually,
                    candidateCount: e.candidateCount,
                    voterLimit: e.voterLimit,
                    candidates: candidates
                });
            }
        }

        return result;
    }

    function getAllElections()
        external
        view
        returns (ElectionWithCandidates[] memory)
    {
        ElectionWithCandidates[] memory result = new ElectionWithCandidates[](
            electionCounter
        );

        for (uint256 i = 0; i < electionCounter; i++) {
            Election storage e = elections[i];
            CandidateView[] memory candidates = new CandidateView[](
                e.candidateCount
            );

            for (uint256 j = 0; j < e.candidateCount; j++) {
                Candidate storage c = e.candidates[j];
                candidates[j] = CandidateView({
                    id: c.id,
                    name: c.name,
                    voteCount: c.voteCount
                });
            }

            result[i] = ElectionWithCandidates({
                id: e.id,
                name: e.name,
                startTime: e.startTime,
                endTime: e.endTime,
                isActive: e.isActive,
                startedManually: e.startedManually,
                endedManually: e.endedManually,
                candidateCount: e.candidateCount,
                voterLimit: e.voterLimit,
                candidates: candidates
            });
        }

        return result;
    }

    function getElectionsByIds(
        uint256[] calldata ids
    ) external view returns (ElectionWithCandidates[] memory) {
        // Тимчасовий масив максимальної довжини
        ElectionWithCandidates[] memory temp = new ElectionWithCandidates[](
            ids.length
        );
        uint256 count = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            if (id >= electionCounter) {
                continue; // Пропускаємо невалідний ID
            }

            Election storage e = elections[id];
            CandidateView[] memory candidates = new CandidateView[](
                e.candidateCount
            );

            for (uint256 j = 0; j < e.candidateCount; j++) {
                Candidate storage c = e.candidates[j];
                candidates[j] = CandidateView({
                    id: c.id,
                    name: c.name,
                    voteCount: c.voteCount
                });
            }

            temp[count++] = ElectionWithCandidates({
                id: e.id,
                name: e.name,
                startTime: e.startTime,
                endTime: e.endTime,
                isActive: e.isActive,
                startedManually: e.startedManually,
                endedManually: e.endedManually,
                candidateCount: e.candidateCount,
                voterLimit: e.voterLimit,
                candidates: candidates
            });
        }

        // Копіюємо лише заповнені елементи
        ElectionWithCandidates[] memory result = new ElectionWithCandidates[](
            count
        );
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }

        return result;
    }

    function getCandidates(
        uint256 _electionId
    )
        external
        view
        validElection(_electionId)
        returns (CandidateView[] memory)
    {
        Election storage e = elections[_electionId];
        CandidateView[] memory result = new CandidateView[](e.candidateCount);
        for (uint256 i = 0; i < e.candidateCount; i++) {
            Candidate storage c = e.candidates[i];
            result[i] = CandidateView({
                id: c.id,
                name: c.name,
                voteCount: c.voteCount
            });
        }
        return result;
    }

    function _getCandidates(
        uint256 _electionId
    ) internal view returns (Candidate[] memory) {
        Election storage e = elections[_electionId];
        Candidate[] memory result = new Candidate[](e.candidateCount);
        for (uint256 i = 0; i < e.candidateCount; i++) {
            result[i] = e.candidates[i];
        }
        return result;
    }

    function getResults(
        uint256 _electionId
    ) external view validElection(_electionId) returns (Candidate[] memory) {
        Election storage e = elections[_electionId];
        require(
            e.endedManually ||
                (e.endTime > 0 && block.timestamp > e.endTime) ||
                (e.voterLimit > 0 && e.voterCount >= e.voterLimit),
            "Election not ended"
        );
        return _getCandidates(_electionId);
    }

    // === SIGNATURE UTIL ===

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
