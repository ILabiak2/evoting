// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library ElectionMetadata {
    struct CandidateView {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct ElectionWithCandidates {
        uint256 id;
        string name;
        uint256 createdAt;
        uint256 startTime;
        uint256 endTime;
        address creator;
        bool isActive;
        bool startedManually;
        bool endedManually;
        uint256 candidateCount;
        uint256 voterLimit;
        CandidateView[] candidates;
    }
}