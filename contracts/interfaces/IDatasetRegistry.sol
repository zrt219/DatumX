// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "./IDrillProofTypes.sol";

interface IDatasetRegistry {
    function submitCanonicalDataset(
        IDrillProofTypes.CanonicalDatasetInput calldata canonicalInput,
        address submitter
    ) external returns (uint256 datasetId);

    function markUnderReview(uint256 datasetId) external;

    function recordValidationState(
        uint256 datasetId,
        uint32 aggregateConfidenceBps,
        uint32 approvalCount,
        uint32 rejectionCount,
        IDrillProofTypes.DatasetStatus nextStatus
    ) external;

    function finalizeDataset(uint256 datasetId) external;

    function getDataset(uint256 datasetId) external view returns (IDrillProofTypes.DatasetRecord memory dataset);

    function getDatasetIdByHash(bytes32 contentHash) external view returns (uint256 datasetId);

    function getProjectDatasetIds(bytes32 projectKey) external view returns (uint256[] memory datasetIds);

    function getParentDatasetId(uint256 datasetId) external view returns (uint256 parentDatasetId);

    function getChildDatasetIds(uint256 datasetId) external view returns (uint256[] memory childDatasetIds);

    function datasetExists(uint256 datasetId) external view returns (bool exists);
}
