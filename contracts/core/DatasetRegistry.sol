// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDatasetRegistry} from "../interfaces/IDatasetRegistry.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DrillProofAccess} from "./DrillProofAccess.sol";
import {ProjectRegistry} from "./ProjectRegistry.sol";
import {DatasetGraph} from "./DatasetGraph.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {DrillProofEvents} from "../libraries/DrillProofEvents.sol";

contract DatasetRegistry is IDatasetRegistry, DatasetGraph {
    DrillProofAccess public immutable accessController;
    ProjectRegistry public immutable projectRegistry;

    address public router;
    address public validationModule;
    uint256 public nextDatasetId = 1;

    mapping(uint256 => IDrillProofTypes.DatasetRecord) private _datasets;
    mapping(bytes32 => uint256) private _datasetIdByHash;
    mapping(bytes32 => uint256[]) private _projectDatasetIds;

    constructor(address accessController_, address projectRegistry_) {
        if (accessController_ == address(0) || projectRegistry_ == address(0)) revert DrillProofErrors.ZeroAddress();
        accessController = DrillProofAccess(accessController_);
        projectRegistry = ProjectRegistry(projectRegistry_);
    }

    modifier onlyAdmin() {
        if (!accessController.hasRole(accessController.DEFAULT_ADMIN_ROLE(), msg.sender)) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier onlyRouter() {
        if (msg.sender != router) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier onlyValidationModule() {
        if (msg.sender != validationModule) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier whenProtocolActive() {
        if (accessController.paused()) revert DrillProofErrors.ProtocolPaused();
        _;
    }

    function setRouter(address router_) external onlyAdmin whenProtocolActive {
        if (router_ == address(0)) revert DrillProofErrors.ZeroAddress();
        router = router_;
        emit DrillProofEvents.RouterConfigured(router_);
    }

    function setValidationModule(address validationModule_) external onlyAdmin whenProtocolActive {
        if (validationModule_ == address(0)) revert DrillProofErrors.ZeroAddress();
        validationModule = validationModule_;
        emit DrillProofEvents.ValidationModuleConfigured(validationModule_);
    }

    function submitCanonicalDataset(IDrillProofTypes.CanonicalDatasetInput calldata canonicalInput, address submitter)
        external
        onlyRouter
        whenProtocolActive
        returns (uint256 datasetId)
    {
        if (canonicalInput.projectKey == bytes32(0) || canonicalInput.contentHash == bytes32(0)) {
            revert DrillProofErrors.InvalidPayload();
        }
        if (bytes(canonicalInput.uri).length == 0) revert DrillProofErrors.EmptyUri();
        if (
            canonicalInput.schemaVersion == 0 || canonicalInput.recordCount == 0 || canonicalInput.claimedConfidenceBps == 0
                || canonicalInput.claimedConfidenceBps > 10_000
        ) revert DrillProofErrors.InvalidPayload();
        if (_datasetIdByHash[canonicalInput.contentHash] != 0) revert DrillProofErrors.DuplicateDataset();
        if (!projectRegistry.isProjectActive(canonicalInput.projectKey)) revert DrillProofErrors.ProjectInactive();

        uint256 parentDatasetId;
        if (canonicalInput.parentDatasetHash != bytes32(0)) {
            parentDatasetId = _datasetIdByHash[canonicalInput.parentDatasetHash];
            if (parentDatasetId == 0) revert DrillProofErrors.ParentDatasetNotFound();
            IDrillProofTypes.DatasetRecord storage parentDataset = _datasets[parentDatasetId];
            if (parentDataset.projectKey != canonicalInput.projectKey) revert DrillProofErrors.ParentProjectMismatch();
            if (parentDataset.status != IDrillProofTypes.DatasetStatus.FINALIZED) revert DrillProofErrors.InvalidLineageTransition();
            if (_childDatasetIds[parentDatasetId].length != 0) revert DrillProofErrors.LineageBranchNotAllowed();
            if (uint8(canonicalInput.datasetType) != uint8(parentDataset.datasetType) + 1) {
                revert DrillProofErrors.InvalidLineageTransition();
            }
        }

        datasetId = nextDatasetId++;
        uint64 timestamp = uint64(block.timestamp);
        _datasets[datasetId] = IDrillProofTypes.DatasetRecord({
            datasetId: datasetId,
            projectKey: canonicalInput.projectKey,
            datasetType: canonicalInput.datasetType,
            status: IDrillProofTypes.DatasetStatus.PENDING,
            contentHash: canonicalInput.contentHash,
            parentDatasetHash: canonicalInput.parentDatasetHash,
            uri: canonicalInput.uri,
            schemaVersion: canonicalInput.schemaVersion,
            recordCount: canonicalInput.recordCount,
            aggregateConfidenceBps: 0,
            approvalCount: 0,
            rejectionCount: 0,
            submitter: submitter,
            createdAt: timestamp,
            updatedAt: timestamp,
            finalizedAt: 0
        });

        _datasetIdByHash[canonicalInput.contentHash] = datasetId;
        _projectDatasetIds[canonicalInput.projectKey].push(datasetId);

        if (parentDatasetId != 0) {
            _linkLineage(parentDatasetId, datasetId);
        }

        emit DrillProofEvents.DatasetRecorded(datasetId, canonicalInput.projectKey, canonicalInput.contentHash, submitter);
    }

    function markUnderReview(uint256 datasetId) external onlyValidationModule whenProtocolActive {
        IDrillProofTypes.DatasetRecord storage dataset = _requireDataset(datasetId);
        if (dataset.status != IDrillProofTypes.DatasetStatus.PENDING) revert DrillProofErrors.InvalidStatusTransition();
        dataset.status = IDrillProofTypes.DatasetStatus.UNDER_REVIEW;
        dataset.updatedAt = uint64(block.timestamp);
        emit DrillProofEvents.DatasetStatusUpdated(datasetId, dataset.status, dataset.approvalCount, dataset.rejectionCount);
    }

    function recordValidationState(
        uint256 datasetId,
        uint32 aggregateConfidenceBps,
        uint32 approvalCount,
        uint32 rejectionCount,
        IDrillProofTypes.DatasetStatus nextStatus
    ) external onlyValidationModule whenProtocolActive {
        IDrillProofTypes.DatasetRecord storage dataset = _requireDataset(datasetId);
        if (dataset.status == IDrillProofTypes.DatasetStatus.FINALIZED) revert DrillProofErrors.InvalidStatusTransition();
        if (
            nextStatus != IDrillProofTypes.DatasetStatus.UNDER_REVIEW
                && nextStatus != IDrillProofTypes.DatasetStatus.APPROVED
                && nextStatus != IDrillProofTypes.DatasetStatus.REJECTED
        ) revert DrillProofErrors.InvalidStatusTransition();
        if (
            dataset.status != IDrillProofTypes.DatasetStatus.UNDER_REVIEW
                && dataset.status != IDrillProofTypes.DatasetStatus.PENDING
        ) revert DrillProofErrors.InvalidStatusTransition();

        dataset.aggregateConfidenceBps = aggregateConfidenceBps;
        dataset.approvalCount = approvalCount;
        dataset.rejectionCount = rejectionCount;
        dataset.status = nextStatus;
        dataset.updatedAt = uint64(block.timestamp);

        emit DrillProofEvents.DatasetStatusUpdated(datasetId, nextStatus, approvalCount, rejectionCount);
    }

    function finalizeDataset(uint256 datasetId) external onlyValidationModule whenProtocolActive {
        IDrillProofTypes.DatasetRecord storage dataset = _requireDataset(datasetId);
        if (dataset.status != IDrillProofTypes.DatasetStatus.APPROVED) revert DrillProofErrors.InvalidStatusTransition();

        dataset.status = IDrillProofTypes.DatasetStatus.FINALIZED;
        dataset.updatedAt = uint64(block.timestamp);
        dataset.finalizedAt = uint64(block.timestamp);

        emit DrillProofEvents.DatasetStatusUpdated(
            datasetId, IDrillProofTypes.DatasetStatus.FINALIZED, dataset.approvalCount, dataset.rejectionCount
        );
        emit DrillProofEvents.DatasetFinalized(datasetId, dataset.finalizedAt);
    }

    function getDataset(uint256 datasetId) external view returns (IDrillProofTypes.DatasetRecord memory dataset) {
        dataset = _datasets[datasetId];
        if (dataset.datasetId == 0) revert DrillProofErrors.DatasetNotFound();
    }

    function getDatasetIdByHash(bytes32 contentHash) external view returns (uint256 datasetId) {
        datasetId = _datasetIdByHash[contentHash];
    }

    function getProjectDatasetIds(bytes32 projectKey) external view returns (uint256[] memory datasetIds) {
        datasetIds = _projectDatasetIds[projectKey];
    }

    function getParentDatasetId(uint256 datasetId)
        public
        view
        override(IDatasetRegistry, DatasetGraph)
        returns (uint256 parentDatasetId)
    {
        parentDatasetId = DatasetGraph.getParentDatasetId(datasetId);
    }

    function getChildDatasetIds(uint256 datasetId)
        public
        view
        override(IDatasetRegistry, DatasetGraph)
        returns (uint256[] memory childDatasetIds)
    {
        childDatasetIds = DatasetGraph.getChildDatasetIds(datasetId);
    }

    function datasetExists(uint256 datasetId) external view returns (bool exists) {
        exists = _datasets[datasetId].datasetId != 0;
    }

    function _requireDataset(uint256 datasetId) internal view returns (IDrillProofTypes.DatasetRecord storage dataset) {
        dataset = _datasets[datasetId];
        if (dataset.datasetId == 0) revert DrillProofErrors.DatasetNotFound();
    }
}
