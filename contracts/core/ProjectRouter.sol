// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProjectAdapter} from "../interfaces/IProjectAdapter.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DatasetRegistry} from "./DatasetRegistry.sol";
import {ProjectRegistry} from "./ProjectRegistry.sol";
import {DrillProofAccess} from "./DrillProofAccess.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {DrillProofEvents} from "../libraries/DrillProofEvents.sol";

contract ProjectRouter {
    DrillProofAccess public immutable accessController;
    ProjectRegistry public immutable projectRegistry;
    DatasetRegistry public immutable datasetRegistry;

    constructor(address accessController_, address projectRegistry_, address datasetRegistry_) {
        if (accessController_ == address(0) || projectRegistry_ == address(0) || datasetRegistry_ == address(0)) {
            revert DrillProofErrors.ZeroAddress();
        }
        accessController = DrillProofAccess(accessController_);
        projectRegistry = ProjectRegistry(projectRegistry_);
        datasetRegistry = DatasetRegistry(datasetRegistry_);
    }

    function submitDataset(
        bytes32 projectKey,
        IDrillProofTypes.AdapterPayload calldata payload,
        string calldata uri,
        bytes32 parentDatasetHash
    )
        external
        returns (uint256 datasetId)
    {
        if (accessController.paused()) revert DrillProofErrors.ProtocolPaused();
        IDrillProofTypes.ProjectMetadata memory project = projectRegistry.getProject(projectKey);
        if (!project.active) revert DrillProofErrors.ProjectInactive();
        if (project.adapter == address(0)) revert DrillProofErrors.AdapterNotConfigured();

        IDrillProofTypes.CanonicalDatasetInput memory canonicalInput =
            IProjectAdapter(project.adapter).normalizeSubmission(projectKey, payload, uri, parentDatasetHash, msg.sender);

        if (canonicalInput.projectKey != projectKey) revert DrillProofErrors.InvalidAdapterResponse();
        datasetId = datasetRegistry.submitCanonicalDataset(canonicalInput, msg.sender);

        emit DrillProofEvents.DatasetSubmissionRouted(projectKey, project.adapter, msg.sender, canonicalInput.contentHash);
    }
}
