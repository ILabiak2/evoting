// @ts-nocheck


const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { groth16 } = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");

let __poseidon;
async function getPoseidon() {
  if (!__poseidon) __poseidon = await buildPoseidon();
  return __poseidon;
}

// ---------- Constants (must match your circuit) ----------
const M_MAX = 100;   // VoteUpdate(100, 20)
const DEPTH = 20;
const FR = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617"); // BN128 scalar field

// ---------- BigInt modular inverse (no ffjavascript dependency) ----------
function modInv(a, mod) {
  // Normalize to [0, mod)
  a = ((a % mod) + mod) % mod;
  if (a === 0n) return 0n; // convention used by our circuit for diff==0

  // Extended Euclidean Algorithm
  let t = 0n, newT = 1n;
  let r = mod, newR = a;
  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  // If a and mod are not coprime (shouldn't happen for field elements), inverse doesn't exist
  if (r !== 1n) throw new Error("modInv: inverse does not exist");
  if (t < 0n) t += mod;
  return t;
}

// ---------- Poseidon helpers ----------
async function poseidonHash(inputs) {
  const p = await getPoseidon();
  const res = p(inputs);
  return BigInt(p.F.toString(res));
}

function toField(x) {
  let r = x % FR;
  if (r < 0n) r += FR;
  return r;
}

function bytes32FromField(v) {
  const hex = toField(v).toString(16).padStart(64, "0");
  return "0x" + hex;
}

// Build a Poseidon Merkle root where the leaf is at index 0 and all siblings = 0
async function poseidonMerkleRootFromLeafAt0(leaf, depth) {
  let cur = leaf;
  for (let i = 0; i < depth; i++) {
    const sibling = 0n;
    cur = await poseidonHash([toField(cur), toField(sibling)]);
  }
  return cur;
}


function invOrZero(x) {
  if (x === 0n) return 0n;
  return modInv(x, FR);
}

// ---------- Poseidon Merkle tree utils (fixed depth, sparse) ----------
async function buildZeroHashes(depth) {
  const zeros = [0n];
  for (let i = 0; i < depth; i++) {
    zeros.push(await poseidonHash([zeros[i], zeros[i]]));
  }
  return zeros; // zeros[h] is the hash of an all-zero subtree of height h
}

// Hash a single leaf upward through `h` levels using Poseidon and zero siblings,
// taking orientation from the low `h` bits of `idx`.
async function singleLeafSubtreeHash(leaf: bigint, idx: number, h: number, zeros: bigint[]): Promise<bigint> {
  let cur: bigint = leaf;
  for (let d = 0; d < h; d++) {
    const bit = (idx >> d) & 1;
    if (bit === 0) {
      cur = await poseidonHash([cur, zeros[d]]);
    } else {
      cur = await poseidonHash([zeros[d], cur]);
    }
  }
  return cur;
}

// returns: { root, paths: { [index]: { pathElements[], pathIndex[] } } }
// `leavesMap` is an object: { "idx": leafFieldValue, ... }, typically few entries
async function buildTreeAndPaths(
  depth: number,
  leavesMap: Record<number, bigint>
) {
  const zeros: bigint[] = await buildZeroHashes(depth);
  const indices: number[] = Object.keys(leavesMap).map((k) => Number(k));
  const leaves: bigint[] = indices.map((i) => leavesMap[i]);

  // helper: check if index j is inside the sibling block of i at level d
  const inSiblingBlock = (i: number, j: number, d: number) =>
    ((i >> (d + 1)) === (j >> (d + 1))) && (((i >> d) & 1) !== ((j >> d) & 1));

  // Build path for a specific leaf index using other explicit leaves as needed
  async function buildPathForIndex(i: number) {
    const pathElements: bigint[] = [];
    const pathIndex: bigint[] = [];
    for (let d = 0; d < depth; d++) {
      // find if any other explicit leaf lies in the sibling subtree at level d
      let sibVal: bigint | undefined = undefined;
      for (let k = 0; k < indices.length; k++) {
        const j = indices[k];
        if (j === i) continue;
        if (inSiblingBlock(i, j, d)) {
          // height of that sibling subtree is exactly d
          sibVal = await singleLeafSubtreeHash(leavesMap[j], j, d, zeros);
          break; // at most one explicit leaf in that subtree for our tests
        }
      }
      if (sibVal === undefined) sibVal = zeros[d];
      const isRight = (i >> d) & 1;
      pathElements.push(sibVal);
      pathIndex.push(BigInt(isRight));
    }
    // Compute root from this path to return a consistent root
    let cur: bigint = leavesMap[i];
    for (let d = 0; d < depth; d++) {
      const isRight = Number(pathIndex[d]);
      const sib = pathElements[d];
      if (isRight === 0) {
        cur = await poseidonHash([cur, sib]);
      } else {
        cur = await poseidonHash([sib, cur]);
      }
    }
    return { pathElements, pathIndex, root: cur };
  }

  // Build paths for all requested indices and take root from the first (they should match)
  const paths: Record<number, { pathElements: bigint[]; pathIndex: bigint[] }> = {};
  let root: bigint | null = null;
  for (const i of indices) {
    const r = await buildPathForIndex(i);
    paths[i] = { pathElements: r.pathElements, pathIndex: r.pathIndex };
    if (root === null) root = r.root;
    else if (root !== r.root) throw new Error("Inconsistent roots in sparse builder");
  }
  // If no leaves, root is the all-zero tree of height `depth`
  if (root === null) root = zeros[depth];
  return { root, paths };
}

async function genProofForVote({
  wasm,
  zkey,
  electionId,
  voterRootField,
  voterSecret,
  candidateIndex,
  mActual,
  oldC,
  newC,
  pathElements,
  pathIndex
}: {
  wasm: string,
  zkey: string,
  electionId: bigint,
  voterRootField: bigint,
  voterSecret: bigint,
  candidateIndex: number,
  mActual: number,
  oldC: bigint[],
  newC: bigint[],
  pathElements: bigint[],
  pathIndex: bigint[]
}) {
  const inv: bigint[] = [];
  for (let i = 0; i < M_MAX; i++) {
    const diff = BigInt(candidateIndex) - BigInt(i);
    inv.push(invOrZero(diff));
  }
  const nullifierHash = await poseidonHash([toField(voterSecret), toField(electionId)]);
  const input = {
    electionId: electionId.toString(),
    voterRoot: voterRootField.toString(),
    nullifierHash: nullifierHash.toString(),
    oldC: oldC.map((x) => x.toString()),
    newC: newC.map((x) => x.toString()),
    mActual: mActual.toString(),
    voterSecret: voterSecret.toString(),
    candidateIndex: candidateIndex.toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndex: pathIndex.map((x) => x.toString()),
    inv: inv.map((x) => x.toString()),
  };
  const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);
  // Normalize proof for EVM
  const a = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
  const b = [
    [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
    [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
  ];
  const c = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];
  const pub = publicSignals.map((s: string) => BigInt(s));
  return { a, b, c, pub };
}

// ---------- Helpers for EIP-712 relayed voting ----------
function keccakPackedUint256Array(arr: readonly (bigint | number | string)[]): string {
  // abi.encodePacked(uint256[]) == tight concat of 32-byte words (no length/offset)
  const hex = "0x" + arr.map((x) => BigInt(x).toString(16).padStart(64, "0")).join("");
  return ethers.keccak256(hex);
}

async function signRelayVote(signer, electionAddress, electionId, publicSignals, nonce) {
  const network = await ethers.provider.getNetwork();
  const domain = {
    name: "PrivateZKElection",
    version: "1",
    chainId: network.chainId,
    verifyingContract: electionAddress,
  };
  const types = {
    RelayVote: [
      { name: "electionId", type: "uint256" },
      { name: "publicSignalsHash", type: "bytes32" },
      { name: "nonce", type: "uint256" },
    ],
  };
  const publicSignalsHash = keccakPackedUint256Array(publicSignals);
  const message = {
    electionId: BigInt(electionId),
    publicSignalsHash,
    nonce: BigInt(nonce),
  };
  // ethers v6
  const sig = await signer.signTypedData(domain, types, message);
  return sig;
}

describe("PrivateZKElection + Groth16 (no adapter)", function () {
  it("initializes, proves, verifies on-chain, and updates hidden tallies", async () => {
    const [creator, admin, voter] = await ethers.getSigners();

    // ---- Deploy Groth16 verifier generated by snarkjs ----
    // The contract name in the generated file is usually "Groth16Verifier".
    const VerifierNames = ["Groth16Verifier", "Verifier", "VoteUpdateVerifierGroth16"];
    let VerifierFactory: any = null;
    for (const n of VerifierNames) {
      try {
        VerifierFactory = await ethers.getContractFactory(n, admin);
        break;
      } catch (e) { /* try next */ }
    }
    if (!VerifierFactory) throw new Error("Groth16 verifier contract not found. Make sure contracts/zk/VoteUpdateVerifierGroth16.sol is compiled.");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // ---- Deploy PrivateZKElection ----
    const Election = await ethers.getContractFactory("PrivateZKElection", admin);
    const election = await Election.deploy();
    await election.waitForDeployment();

    // ---- Prepare election + voter tree ----
    const electionId = 1n;
    const candidateNames = ["Alice", "Bob", "Carol"]; // mActual = 3
    const mActual = candidateNames.length;
    const voterLimit = 0n;
    const startImmediately = true;

    const voterSecret = 123456789n; // test secret
    const leaf = await poseidonHash([toField(voterSecret)]);
    const voterRootField = await poseidonMerkleRootFromLeafAt0(leaf, DEPTH);
    const voterRootBytes32 = bytes32FromField(voterRootField);

    // Initialize with Groth16 verifier address (no tally verifier: zero address)
    await election.connect(admin).initialize(
      "ZK vote",
      candidateNames,
      creator.address,
      admin.address,
      electionId,
      voterLimit,
      startImmediately,
      voterRootBytes32,
      await verifier.getAddress(),
      ethers.ZeroAddress
    );

    // Sanity: tallyCommitments should be zeros of length M_MAX
    const before = await election.getTallyCommitments();
    expect(before.length).to.equal(M_MAX);
    for (let i = 0; i < M_MAX; i++) expect(before[i]).to.equal(0n);

    // ---- Build circuit inputs ----
    const candidateIndex = 1; // vote for "Bob"

    const oldC: bigint[] = Array(M_MAX).fill(0n) as bigint[];
    const newC: bigint[] = oldC.slice();
    newC[candidateIndex] = 1n;

    const pathElements: bigint[] = Array(DEPTH).fill(0n) as bigint[];
    const pathIndex: bigint[] = Array(DEPTH).fill(0n) as bigint[]; // all left

    const nullifierHash = await poseidonHash([toField(voterSecret), toField(electionId)]);

    // inv[M] witness for equality gadget
    const inv: bigint[] = [];
    for (let i = 0; i < M_MAX; i++) {
      const diff = BigInt(candidateIndex) - BigInt(i);
      inv.push(invOrZero(diff));
    }

    // Public signals must be exactly 4 + 2*M_MAX = 204
    const expectedLen = 4 + 2 * M_MAX;

    // Full prover inputs
    const input = {
      electionId: electionId.toString(),
      voterRoot: voterRootField.toString(),
      nullifierHash: nullifierHash.toString(),
      oldC: oldC.map((x) => x.toString()),
      newC: newC.map((x) => x.toString()),
      mActual: mActual.toString(),
      voterSecret: voterSecret.toString(),
      candidateIndex: candidateIndex.toString(),
      pathElements: pathElements.map((x) => x.toString()),
      pathIndex: pathIndex.map((x) => x.toString()),
      inv: inv.map((x) => x.toString()),
    };

    const wasm = path.resolve("contracts/zk/build/vote_update_js/vote_update.wasm");
    const zkey = path.resolve("contracts/zk/build/vote_update.zkey");
    if (!fs.existsSync(wasm)) throw new Error("Missing vote_update.wasm");
    if (!fs.existsSync(zkey)) throw new Error("Missing vote_update.zkey");

    const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);
    const pub = publicSignals.map((s) => BigInt(s));
    expect(pub.length).to.equal(expectedLen);

    // Normalize Groth16 proof for EVM (bn128): swap inner elements of b
    let a = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
    let b = [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
    ];
    let c = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];

    // ---- Direct verifier sanity check (must be true) ----
    // Groth16 verifier expects fixed-length uint256[204], copy pub -> fixed
    const pubFixed = Array.from({ length: expectedLen }, (_, i) => pub[i]);
    // Prefer named call if ABI exposes it
    let okDirect = false;
    try {
      okDirect = await verifier.verifyProof.staticCall(a, b, c, pubFixed);
    } catch (_) {
      // Try encoded signature if ABI name differs
      const sig = "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[204])";
      const data = verifier.interface.encodeFunctionData(sig, [a, b, c, pubFixed]);
      const ret = await ethers.provider.call({ to: await verifier.getAddress(), data });
      [okDirect] = verifier.interface.decodeFunctionResult(sig, ret);
    }
    expect(okDirect).to.equal(true);

    // ---- Call PrivateZKElection.voteZK (direct Groth16 interface) ----
    await expect(
      election.connect(voter).voteZK(a, b, c, pub, ethers.ZeroHash)
    ).to.emit(election, "SecretVote");

    // ---- Hidden tallies updated on-chain ----
    const after = await election.getTallyCommitments();
    expect(after.length).to.equal(M_MAX);
    for (let i = 0; i < M_MAX; i++) {
      const expected = i === candidateIndex ? 1n : 0n;
      expect(after[i]).to.equal(expected);
    }
  });

  it("handles multiple votes (different voters), maintains commitments, and finalizes results", async () => {
    const [creator, admin, voter1, voter2] = await ethers.getSigners();

    // Deploy verifier
    const VerifierNames = ["Groth16Verifier", "Verifier", "VoteUpdateVerifierGroth16"];
    let VerifierFactory:any = null;
    for (const n of VerifierNames) {
      try {
        VerifierFactory = await ethers.getContractFactory(n, admin);
        break;
      } catch (e) {}
    }
    if (!VerifierFactory) throw new Error("Groth16 verifier not found");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // Deploy election
    const Election = await ethers.getContractFactory("PrivateZKElection", admin);
    const election = await Election.deploy();
    await election.waitForDeployment();

    // Build a voter tree with 2 authorized voters at indices 3 and 5
    const electionId = 7n;
    const candidateNames = ["A", "B", "C"];
    const mActual = candidateNames.length;
    const voterSecret1 = 111111111n;
    const voterSecret2 = 222222222n;
    const leaf1 = await poseidonHash([toField(voterSecret1)]);
    const leaf2 = await poseidonHash([toField(voterSecret2)]);
    const depth = DEPTH;
    const leavesMap = { 3: leaf1, 5: leaf2 };
    const { root, paths } = await buildTreeAndPaths(depth, leavesMap);
    const voterRootBytes32 = bytes32FromField(root);

    await election.connect(admin).initialize(
      "ZK vote 2",
      candidateNames,
      creator.address,
      admin.address,
      electionId,
      0,              // voterLimit
      true,           // startImmediately
      voterRootBytes32,
      await verifier.getAddress(),
      ethers.ZeroAddress
    );

    const wasm = path.resolve("contracts/zk/build/vote_update_js/vote_update.wasm");
    const zkey = path.resolve("contracts/zk/build/vote_update.zkey");
    if (!fs.existsSync(wasm)) throw new Error("Missing vote_update.wasm");
    if (!fs.existsSync(zkey)) throw new Error("Missing vote_update.zkey");

    // ---- Vote #1: voter1 votes for candidate 2 ("C") ----
    {
      const candidateIndex = 2;
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice();
      newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret: voterSecret1, candidateIndex, mActual, oldC, newC,
        pathElements: paths[3].pathElements, pathIndex: paths[3].pathIndex
      });

      await expect(
        election.connect(voter1).voteZK(a, b, c, pub, ethers.ZeroHash)
      ).to.emit(election, "SecretVote");

      const after = await election.getTallyCommitments();
      expect(BigInt(after[candidateIndex])).to.equal(BigInt(before[candidateIndex]) + 1n);
    }

    // ---- Vote #2: voter2 votes for candidate 1 ("B") ----
    {
      const candidateIndex = 1;
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice();
      newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret: voterSecret2, candidateIndex, mActual, oldC, newC,
        pathElements: paths[5].pathElements, pathIndex: paths[5].pathIndex
      });

      await expect(
        election.connect(voter2).voteZK(a, b, c, pub, ethers.ZeroHash)
      ).to.emit(election, "SecretVote");

      const after = await election.getTallyCommitments();
      expect(BigInt(after[candidateIndex])).to.equal(BigInt(before[candidateIndex]) + 1n);
    }

    // End election and publish final counts
    await election.connect(creator).endElection();
    const committed = await election.getTallyCommitments();
    const counts = [committed[0], committed[1], committed[2]]; // only first mActual
    const roots = [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash];
    await election.connect(creator).publishFinalCountsAndRoots(counts, roots, "0x", []);

    const results = await election.getResults();
    expect(results.length).to.equal(3);
    // Expect B and C to have 1 each, A to have 0
    expect(results[0].voteCount).to.equal(0n);
    expect(results[1].voteCount).to.equal(1n);
    expect(results[2].voteCount).to.equal(1n);
  });
  });

  it("supports relayed voting by multiple voters and updates tallies", async () => {
    const [creator, admin, voter1, voter2, relayer] = await ethers.getSigners();

    // Deploy verifier
    const VerifierNames = ["Groth16Verifier", "Verifier", "VoteUpdateVerifierGroth16"];
    let VerifierFactory:any = null;
    for (const n of VerifierNames) {
      try {
        VerifierFactory = await ethers.getContractFactory(n, admin);
        break;
      } catch (e) {}
    }
    if (!VerifierFactory) throw new Error("Groth16 verifier not found");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // Deploy election
    const Election = await ethers.getContractFactory("PrivateZKElection", admin);
    const election = await Election.deploy();
    await election.waitForDeployment();

    // Two authorized voters at indices 2 and 9
    const electionId = 11n;
    const candidateNames = ["A", "B", "C"];
    const mActual = candidateNames.length;
    const voterSecret1 = 333333333n;
    const voterSecret2 = 444444444n;
    const leaf1 = await poseidonHash([toField(voterSecret1)]);
    const leaf2 = await poseidonHash([toField(voterSecret2)]);
    const { root, paths } = await buildTreeAndPaths(DEPTH, { 2: leaf1, 9: leaf2 });
    const voterRootBytes32 = bytes32FromField(root);

    await election.connect(admin).initialize(
      "ZK relayed",
      candidateNames,
      creator.address,
      admin.address,
      electionId,
      0,
      true,
      voterRootBytes32,
      await verifier.getAddress(),
      ethers.ZeroAddress
    );

    const wasm = path.resolve("contracts/zk/build/vote_update_js/vote_update.wasm");
    const zkey = path.resolve("contracts/zk/build/vote_update.zkey");
    if (!fs.existsSync(wasm)) throw new Error("Missing vote_update.wasm");
    if (!fs.existsSync(zkey)) throw new Error("Missing vote_update.zkey");

    // Vote #1 (relayed): voter1 -> candidate 0
    {
      const candidateIndex = 0;
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice(); newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret: voterSecret1, candidateIndex, mActual, oldC, newC,
        pathElements: paths[2].pathElements, pathIndex: paths[2].pathIndex
      });

      // Nonce for voter1
      const nonce1 = await election.nonces(voter1.address);
      const sig1 = await signRelayVote(voter1, await election.getAddress(), electionId, pub, nonce1);

      await expect(
        election.connect(relayer).voteZKRelayed(a, b, c, pub, nonce1, sig1)
      ).to.emit(election, "SecretVote");

      const after = await election.getTallyCommitments();
      expect(BigInt(after[candidateIndex])).to.equal(BigInt(before[candidateIndex]) + 1n);
    }

    // Vote #2 (relayed): voter2 -> candidate 2
    {
      const candidateIndex = 2;
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice(); newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret: voterSecret2, candidateIndex, mActual, oldC, newC,
        pathElements: paths[9].pathElements, pathIndex: paths[9].pathIndex
      });

      const nonce2 = await election.nonces(voter2.address);
      const sig2 = await signRelayVote(voter2, await election.getAddress(), electionId, pub, nonce2);

      await expect(
        election.connect(relayer).voteZKRelayed(a, b, c, pub, nonce2, sig2)
      ).to.emit(election, "SecretVote");

      const after = await election.getTallyCommitments();
      expect(BigInt(after[candidateIndex])).to.equal(BigInt(before[candidateIndex]) + 1n);
    }

    // Finalize and check results reflect the two votes
    await election.connect(creator).endElection();
    const committed = await election.getTallyCommitments();
    const counts = [committed[0], committed[1], committed[2]];
    const roots = [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash];
    await election.connect(creator).publishFinalCountsAndRoots(counts, roots, "0x", []);
    const results = await election.getResults();
    expect(results[0].voteCount).to.equal(1n);
    expect(results[1].voteCount).to.equal(0n);
    expect(results[2].voteCount).to.equal(1n);
  });

  it("prevents double-voting via relayed function (nullifier + nonce)", async () => {
    const [creator, admin, voter, relayer] = await ethers.getSigners();

    // Deploy verifier
    const VerifierNames = ["Groth16Verifier", "Verifier", "VoteUpdateVerifierGroth16"];
    let VerifierFactory:any = null;
    for (const n of VerifierNames) {
      try {
        VerifierFactory = await ethers.getContractFactory(n, admin);
        break;
      } catch (e) {}
    }
    if (!VerifierFactory) throw new Error("Groth16 verifier not found");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    // Deploy election
    const Election = await ethers.getContractFactory("PrivateZKElection", admin);
    const election = await Election.deploy();
    await election.waitForDeployment();

    // One authorized voter at index 4
    const electionId = 22n;
    const candidateNames = ["A", "B"];
    const mActual = candidateNames.length;
    const voterSecret = 999999999n;
    const leaf = await poseidonHash([toField(voterSecret)]);
    const { root, paths } = await buildTreeAndPaths(DEPTH, { 4: leaf });
    const voterRootBytes32 = bytes32FromField(root);

    await election.connect(admin).initialize(
      "ZK relayed 2",
      candidateNames,
      creator.address,
      admin.address,
      electionId,
      0,
      true,
      voterRootBytes32,
      await verifier.getAddress(),
      ethers.ZeroAddress
    );

    const wasm = path.resolve("contracts/zk/build/vote_update_js/vote_update.wasm");
    const zkey = path.resolve("contracts/zk/build/vote_update.zkey");
    if (!fs.existsSync(wasm)) throw new Error("Missing vote_update.wasm");
    if (!fs.existsSync(zkey)) throw new Error("Missing vote_update.zkey");

    // First (valid) relayed vote
    const candidateIndex = 1;
    {
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice(); newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret, candidateIndex, mActual, oldC, newC,
        pathElements: paths[4].pathElements, pathIndex: paths[4].pathIndex
      });

      const nonce = await election.nonces(voter.address);
      const sig = await signRelayVote(voter, await election.getAddress(), electionId, pub, nonce);

      await expect(
        election.connect(relayer).voteZKRelayed(a, b, c, pub, nonce, sig)
      ).to.emit(election, "SecretVote");
    }

    // Second attempt (should fail): same secret → same nullifier, even with new nonce/proof
    {
      // Build next state oldC/newC reflecting one prior vote
      const before = (await election.getTallyCommitments()).map((x) => BigInt(x));
      const oldC = Array.from({ length: M_MAX }, (_, i) => before[i] ?? 0n);
      const newC = oldC.slice(); newC[candidateIndex] = newC[candidateIndex] + 1n;

      const { a, b, c, pub } = await genProofForVote({
        wasm, zkey, electionId, voterRootField: root,
        voterSecret, candidateIndex, mActual, oldC, newC,
        pathElements: paths[4].pathElements, pathIndex: paths[4].pathIndex
      });

      // Nonce advanced after first vote
      const nonce2 = await election.nonces(voter.address);
      const sig2 = await signRelayVote(voter, await election.getAddress(), electionId, pub, nonce2);

      await expect(
        election.connect(relayer).voteZKRelayed(a, b, c, pub, nonce2, sig2)
      ).to.be.revertedWith("Nullifier used");
    }
  });