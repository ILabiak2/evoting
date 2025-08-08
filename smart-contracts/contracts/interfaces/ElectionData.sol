// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ElectionMetadata } from "../lib/ElectionMetadata.sol";

interface ElectionData {
    function getCoreElectionData()
        external
        view
        returns (ElectionMetadata.ElectionWithCandidates memory);

    function getVotedCandidateIds(address user) external view returns (uint256[] memory);
}