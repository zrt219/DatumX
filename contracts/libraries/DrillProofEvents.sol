// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";

library DrillProofEvents {
    event ProjectRegistered(bytes32 indexed projectKey, string name, address indexed adapter, bool active);
    event ProjectUpdated(bytes32 indexed projectKey, address indexed adapter, bool active);
    event RouterConfigured(address indexed router);
    event ValidationModuleConfigured(address indexed validationModule);
    event DatasetSubmissionRouted(bytes32 indexed projectKey, address indexed adapter, address indexed submitter, bytes32 contentHash);
    event DatasetRecorded(uint256 indexed datasetId, bytes32 indexed projectKey, bytes32 indexed contentHash, address submitter);
    event DatasetStatusUpdated(uint256 indexed datasetId, IDrillProofTypes.DatasetStatus status, uint32 approvals, uint32 rejections);
    event DatasetFinalized(uint256 indexed datasetId, uint64 finalizedAt);
    event ReviewSubmitted(uint256 indexed datasetId, address indexed reviewer, bool approved, uint16 confidenceBps);
    event ThresholdsUpdated(uint16 minValidatorCount, uint16 minApprovalRatioBps, uint16 minConfidenceBps);
}
