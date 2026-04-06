// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "./IDrillProofTypes.sol";

interface IValidationModule {
    function submitReview(uint256 datasetId, bool approved, uint16 confidenceBps, string calldata reviewUri) external;

    function finalizeDataset(uint256 datasetId) external;

    function getReview(uint256 datasetId, address reviewer) external view returns (IDrillProofTypes.Review memory review);

    function getThresholds() external view returns (IDrillProofTypes.ValidationThresholds memory thresholds);

    function isFinalizationEligible(uint256 datasetId) external view returns (bool eligible);
}
