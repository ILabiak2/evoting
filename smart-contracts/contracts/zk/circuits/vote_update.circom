pragma circom 2.1.6;

include "poseidon.circom";

template VoteUpdate(M, DEPTH) {
    // ---- Public ----
    signal input electionId;
    signal input voterRoot;
    signal input nullifierHash;
    signal input oldC[M];
    signal input newC[M];
    signal input mActual;              // number of real candidates (<= M)

    // ---- Private ----
    signal input voterSecret;             // field element
    signal input candidateIndex;          // in [0..M-1]
    signal input pathElements[DEPTH];     // Merkle path siblings
    signal input pathIndex[DEPTH];        // 0 left, 1 right

    // 1) leaf = Poseidon(voterSecret)
    component Hleaf = Poseidon(1);
    Hleaf.inputs[0] <== voterSecret;
    signal leaf;
    leaf <== Hleaf.out;

    // 2) Merkle membership: compute Poseidon Merkle path manually
    // Predeclare arrays to satisfy Circom scoping rules
    signal isRight[DEPTH];
    signal left[DEPTH];
    signal right[DEPTH];
    component H[DEPTH];

    signal notRight[DEPTH];
    signal aL[DEPTH];
    signal bL[DEPTH];
    signal aR[DEPTH];
    signal bR[DEPTH];

    signal cur[DEPTH+1];
    cur[0] <== leaf;
    for (var i = 0; i < DEPTH; i++) {
        // ensure pathIndex[i] is boolean
        isRight[i] <== pathIndex[i];
        isRight[i] * (isRight[i] - 1) === 0;

        // Compute (1 - isRight) once
        notRight[i] <== 1 - isRight[i];

        // left = cur * (1 - isRight) + pathElements[i] * isRight
        aL[i] <== cur[i] * notRight[i];
        bL[i] <== pathElements[i] * isRight[i];
        left[i] <== aL[i] + bL[i];

        // right = pathElements[i] * (1 - isRight) + cur * isRight
        aR[i] <== pathElements[i] * notRight[i];
        bR[i] <== cur[i] * isRight[i];
        right[i] <== aR[i] + bR[i];

        H[i] = Poseidon(2);
        H[i].inputs[0] <== left[i];
        H[i].inputs[1] <== right[i];
        cur[i+1] <== H[i].out;
    }
    // enforce root match
    cur[DEPTH] === voterRoot;

    // 3) nullifier = Poseidon(voterSecret, electionId)
    component Hnull = Poseidon(2);
    Hnull.inputs[0] <== voterSecret;
    Hnull.inputs[1] <== electionId;
    Hnull.out === nullifierHash;

    // 4) Enforce +1 exactly at candidateIndex (dependency-free equality gadget)
    signal isChosen[M];
    signal diff[M];
    signal input inv[M]; // witness for 1/diff when diff != 0; set 0 when diff == 0
    signal prod[M];      // prod[i] = diff[i] * inv[i]

    for (var i = 0; i < M; i++) {
        // diff = candidateIndex - i
        diff[i] <== candidateIndex - i;

        // prod = diff * inv  (introduce multiplication as its own constraint)
        prod[i] <== diff[i] * inv[i];

        isChosen[i] <== 1 - prod[i];

        // Booleanity for isChosen
        isChosen[i] * (isChosen[i] - 1) === 0;

        // Enforce selector semantics:
        //  (A) diff * isChosen == 0   -> if diff != 0 then isChosen = 0
        diff[i] * isChosen[i] === 0;

        // Apply +1 exactly at chosen index
        newC[i] === oldC[i] + isChosen[i];
    }

    // ---- Expose required public signals (as outputs) ----
    signal output pubElectionId;
    signal output pubVoterRoot;
    signal output pubNullifier;
    signal output pubMActual;
    signal output pubOldC[M];
    signal output pubNewC[M];

    pubElectionId <== electionId;
    pubVoterRoot  <== voterRoot;
    pubNullifier  <== nullifierHash;
    pubMActual    <== mActual;
    for (var i = 0; i < M; i++) {
        pubOldC[i] <== oldC[i];
        pubNewC[i] <== newC[i];
    }
}

// Fill in M and DEPTH at compile-time:
// M is the compiled upper bound (MAX_CANDIDATES), mActual is passed at proof time.
component main = VoteUpdate(100, 20);