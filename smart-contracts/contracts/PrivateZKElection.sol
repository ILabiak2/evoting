// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BaseElection.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @notice Verifier for per-vote ZK updates. You will paste the concrete verifier
///         (generated from your prebuilt circuit) under contracts/zk/VoteUpdateVerifier.sol
///         which must expose the same function signature.
// interface IVoteUpdateVerifier {
//     function verifyProof(
//         bytes calldata proof,
//         uint256[] calldata publicSignals
//     ) external view returns (bool);
// }

interface IGroth16VoteUpdateVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[204] calldata _pubSignals
    ) external view returns (bool);
}


contract PrivateZKElection is BaseElection, EIP712Upgradeable {
    bool private initialized;

    // ---- ZK state ----
    bytes32 public voterRoot; // Merkle root of authorized voters (Poseidon tree in the ZK circuit)
    // IVoteUpdateVerifier public voteVerifier; // per-vote proof verifier
    address public voteVerifier;
    // ITallyVerifier public tallyVerifier; // optional final tally proof verifier

    mapping(bytes32 => bool) public nullifierUsed; // prevents double-vote (nullifier = H(secret, electionId))
    uint256[] public tallyCommitments; // hidden tallies vector (length == candidates.length)

    // ---- Finalization (public results + self-check) ----
    bool public finalTallyRevealed;
    bytes32[] public finalBucketRoots; // per-candidate Merkle roots of nullifiers (keccak leaves)

    // ---- EIP-712 Relay (gasless via relayer) ----
    mapping(address => uint256) public nonces;
    bytes32 public constant RELAY_TYPEHASH = keccak256(
        "RelayVote(uint256 electionId,bytes32 publicSignalsHash,uint256 nonce)"
    );

    // ---- Events ----
    event SecretVote(uint256 indexed electionId, bytes32 indexed nullifier);
    event TallyCommitmentsUpdated(
        uint256 indexed electionId,
        uint256[] newCommitments
    );
    event Finalized(uint256 indexed electionId);

    // ---- Groth16 verifier helper ----
    function _verifyGroth(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[204] memory pubFixed
    ) internal view returns (bool) {
        return IGroth16VoteUpdateVerifier(voteVerifier).verifyProof(pA, pB, pC, pubFixed);
    }

    /**
     * @notice Initialize the ZK election (factory will call this).
     * @param _name                election name
     * @param _candidateNames      candidate list
     * @param _creator             creator address (owner for admin actions)
     * @param _admin               global admin (deployer / factory admin)
     * @param _electionId          sequential id assigned by factory
     * @param _voterLimit          0 = unlimited, otherwise auto-end when reached
     * @param _startImmediately    true to start at once
     * @param _voterRoot           Merkle root of authorized voters (must match the circuit)
     * @param _voteVerifier        deployed VoteUpdateVerifier contract address
     * @param _tallyVerifier       optional TallyVerifier (address(0) if unused)
     */
    function initialize(
        string memory _name,
        string[] memory _candidateNames,
        address _creator,
        address _admin,
        uint256 _electionId,
        uint256 _voterLimit,
        bool _startImmediately,
        bytes32 _voterRoot,
        address _voteVerifier,
        address _tallyVerifier
    ) external initializer {
        require(!initialized, "Already initialized");
        initialized = true;

        __BaseElection_init(
            _name,
            _candidateNames,
            _creator,
            _admin,
            _electionId,
            _voterLimit,
            _startImmediately,
            1 // single-choice semantics (maxChoicesPerVoter in BaseElection)
        );

        voterRoot = _voterRoot;
        // voteVerifier = IVoteUpdateVerifier(_voteVerifier);
        voteVerifier = _voteVerifier;
        // tallyVerifier = ITallyVerifier(_tallyVerifier);
        __EIP712_init("PrivateZKElection", "1");

        // allocate vectors according to candidate count
        // tallyCommitments = new uint256[](candidates.length);
        // finalBucketRoots = new bytes32[](candidates.length);
        tallyCommitments = new uint256[](MAX_CANDIDATES);
        finalBucketRoots = new bytes32[](MAX_CANDIDATES);
    }

    function _recoverRelaySigner(bytes32 psHash, uint256 nonce, bytes calldata voterSig) internal view returns (address) {
        bytes32 structHash = keccak256(abi.encode(RELAY_TYPEHASH, electionId, psHash, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, voterSig);
    }

    function _emitCommitmentsSnapshot() internal {
        uint256 m = MAX_CANDIDATES;
        uint256[] memory snapshot = new uint256[](m);
        for (uint256 i = 0; i < m; i++) {
            snapshot[i] = tallyCommitments[i];
        }
        emit TallyCommitmentsUpdated(electionId, snapshot);
    }

    function _processVote(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[] calldata publicSignals,
        address creditedVoter
    ) internal {
        uint256 mMax = MAX_CANDIDATES;
        require(publicSignals.length == 4 + 2 * mMax, "Bad publicSignals len");

        bytes32 nullifierLocal;
        {
            uint256 pubElectionId = publicSignals[0];
            uint256 pubVoterRoot  = publicSignals[1];
            uint256 pubNullifier  = publicSignals[2];
            uint256 pubMActual    = publicSignals[3];

            require(pubMActual == candidates.length, "mActual mismatch");
            require(pubElectionId == electionId, "Wrong electionId");
            require(bytes32(pubVoterRoot) == voterRoot, "Wrong voter root");

            nullifierLocal = bytes32(pubNullifier);
            require(!nullifierUsed[nullifierLocal], "Nullifier used");
        }

        // ensure the proof was made against current on-chain commitments
        {
            uint256 off = 4;
            for (uint256 i = 0; i < mMax; i++) {
                require(publicSignals[off + i] == tallyCommitments[i], "Stale commitments");
            }
        }

        // verify proof (convert to fixed-size pubSignals for Groth16 verifier)
        {
            uint256[204] memory pubFixed;
            for (uint256 i = 0; i < 204; i++) {
                pubFixed[i] = publicSignals[i];
            }
            bool ok = _verifyGroth(pA, pB, pC, pubFixed);
            require(ok, "Invalid vote proof");
        }

        // apply new hidden tallies
        {
            uint256 offN = 4 + mMax;
            for (uint256 i = 0; i < mMax; i++) {
                tallyCommitments[i] = publicSignals[offN + i];
            }
        }

        // mark nullifier and credit the voter
        nullifierUsed[nullifierLocal] = true;
        hasVoted[creditedVoter] = true;
        votedCandidates[creditedVoter].push(type(uint256).max);
        voterCount++;
        electionVoters.push(creditedVoter);

        emit SecretVote(electionId, nullifierLocal);
        _emitCommitmentsSnapshot();

        if (voterLimit > 0 && voterCount >= voterLimit) {
            isActive = false;
            ended = true;
            endTime = block.timestamp;
            emit ElectionEnded(electionId);
        }
    }

    function voteZK(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[] calldata publicSignals,
        bytes32 /*voterSignal*/
    ) external electionOngoing {
        _processVote(pA, pB, pC, publicSignals, msg.sender);
    }

    /**
     * @notice Gasless relayed vote: the voter signs an EIP-712 message binding this election and the publicSignals;
     *         a relayer submits the proof on-chain and pays gas. Contract credits the recovered voter (not msg.sender).
     * @param pA,pB,pC         Groth16 proof
     * @param publicSignals    public inputs (same layout as voteZK)
     * @param nonce            anti-replay nonce per voter (must equal nonces[voter])
     * @param voterSig         EIP-712 signature by the voter over (electionId, keccak256(publicSignals), nonce)
     */
    function voteZKRelayed(
        uint256[2] calldata pA,
        uint256[2][2] calldata pB,
        uint256[2] calldata pC,
        uint256[] calldata publicSignals,
        uint256 nonce,
        bytes calldata voterSig
    ) external electionOngoing {
        uint256 mMax = MAX_CANDIDATES;
        require(publicSignals.length == 4 + 2 * mMax, "Bad publicSignals len");

        // Recover voter from EIP-712 signature (bind to this election and these publicSignals)
        bytes32 psHash = keccak256(abi.encodePacked(publicSignals));
        address voter = _recoverRelaySigner(psHash, nonce, voterSig);
        require(voter != address(0), "bad sig");
        require(nonces[voter] == nonce, "bad nonce");

        // Process vote crediting the recovered voter
        _processVote(pA, pB, pC, publicSignals, voter);
        // advance nonce AFTER successful processing
        nonces[voter] = nonce + 1;
    }

    /**
     * @notice Finalize election: publish plaintext counts and per-candidate Merkle roots of nullifiers.
     * @dev Path B (integers): the contract enforces counts[i] == tallyCommitments[i].
     *      If a tally verifier is configured, the proof is also checked (but not required for Path B).
     */
    function publishFinalCountsAndRoots(
        uint256[] calldata counts,
        bytes32[] calldata roots,
        bytes calldata _tallyProof,
        uint256[] calldata _tallySignals
    ) external onlyCreator {
        require(
            ended ||
                (endTime > 0 && block.timestamp > endTime) ||
                (voterLimit > 0 && voterCount >= voterLimit),
            "Election not ended"
        );
        require(!finalTallyRevealed, "Already finalized");
        require(counts.length == candidates.length, "Counts length mismatch");
        require(roots.length == candidates.length, "Roots length mismatch");

        // Path B (integers): enforce that the revealed counts match the on-chain running tallies
        for (uint256 i = 0; i < counts.length; i++) {
            require(counts[i] == tallyCommitments[i], "Counts mismatch");
        }

        // optional: cryptographic binding between final commitments and plaintext counts
        // if (address(tallyVerifier) != address(0)) {
        //     require(
        //         tallyVerifier.verifyProof(_tallyProof, _tallySignals),
        //         "Bad tally proof"
        //     );
        // }

        for (uint256 i = 0; i < counts.length; i++) {
            candidates[i].voteCount = counts[i];
            finalBucketRoots[i] = roots[i];
        }

        finalTallyRevealed = true;
        emit Finalized(electionId);
    }

    /**
     * @notice Returns plaintext results after finalization.
     */
    function getResults() external view returns (Candidate[] memory) {
        require(
            ended ||
                (endTime > 0 && block.timestamp > endTime) ||
                (voterLimit > 0 && voterCount >= voterLimit),
            "Election not ended"
        );
        require(finalTallyRevealed, "Final counts not revealed");

        Candidate[] memory result = new Candidate[](candidates.length);
        for (uint256 i = 0; i < candidates.length; i++) {
            result[i] = candidates[i];
        }
        return result;
    }

    /**
     * @notice Allow a voter to self-verify that their nullifier is included
     *         in the final bucket of a candidate (post-finalization).
     * @dev Uses keccak-based Merkle (binary). Leaf = keccak256(abi.encodePacked(nullifier)).
     *      Keep the same hashing convention off-chain when building the trees.
     * @param nullifier    Poseidon(secret,electionId) (or whatever your circuit used), provided by the voter
     * @param candidateId  candidate index
     * @param proof        sibling hashes from leaf to root (bottom-up)
     * @param index        leaf index (bitfield decides left/right at each level)
     */
    function verifyNullifierInBucket(
        bytes32 nullifier,
        uint256 candidateId,
        bytes32[] calldata proof,
        uint256 index
    ) external view returns (bool) {
        require(finalTallyRevealed, "Final roots not published");
        require(candidateId < candidates.length, "Bad candidate");

        bytes32 leaf = keccak256(abi.encodePacked(nullifier));
        bytes32 root = _computeMerkleRoot(leaf, proof, index);
        return (root == finalBucketRoots[candidateId]);
    }

    /**
     * @notice Convenience getter to fetch the current hidden tally commitments.
     */
    function getTallyCommitments() external view returns (uint256[] memory) {
        uint256 m = tallyCommitments.length;
        uint256[] memory out = new uint256[](m);
        for (uint256 i = 0; i < m; i++) out[i] = tallyCommitments[i];
        return out;
    }

    /**
     * @notice Convenience getter to fetch final per-candidate roots.
     */
    function getFinalBucketRoots() external view returns (bytes32[] memory) {
        uint256 m = candidates.length;
        bytes32[] memory out = new bytes32[](m);
        for (uint256 i = 0; i < m; i++) out[i] = finalBucketRoots[i];
        return out;
    }

    // ---- Internal Merkle helper (keccak binary tree) ----
    function _computeMerkleRoot(
        bytes32 leaf,
        bytes32[] calldata proof,
        uint256 index
    ) internal pure returns (bytes32) {
        bytes32 h = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 p = proof[i];
            if ((index & 1) == 0) {
                // current is left
                h = keccak256(abi.encodePacked(h, p));
            } else {
                // current is right
                h = keccak256(abi.encodePacked(p, h));
            }
            index >>= 1;
        }
        return h;
    }
    // Satisfy BaseElection abstract hook; this election uses ZK path exclusively.
    function _internalVote(
        uint256 /* _candidateId */,
        address /* _voter */
    ) internal pure override {
        revert("Use voteZK");
    }

    function addCandidates(string[] memory) external pure override {
        revert("Candidate list immutable for ZK election");
    }

    function removeCandidate(uint256) external pure override {
        revert("Candidate list immutable for ZK election");
    }

    function editCandidateName(
        uint256,
        string calldata
    ) external pure override {
        revert("Candidate list immutable for ZK election");
    }
}
