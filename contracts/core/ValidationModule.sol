// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IValidationModule} from "../interfaces/IValidationModule.sol";
import {IDatasetRegistry} from "../interfaces/IDatasetRegistry.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DrillProofAccess} from "./DrillProofAccess.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {DrillProofEvents} from "../libraries/DrillProofEvents.sol";

contract ValidationModule is IValidationModule, IDrillProofTypes {
    DrillProofAccess public immutable accessController;
    IDatasetRegistry public immutable datasetRegistry;

    ValidationThresholds private _thresholds;

    mapping(uint256 => mapping(address => Review)) private _reviews;
    mapping(uint256 => address[]) private _reviewers;
    mapping(uint256 => uint256) private _confidenceTotals;

    constructor(address accessController_, address datasetRegistry_, ValidationThresholds memory thresholds_) {
        if (accessController_ == address(0) || datasetRegistry_ == address(0)) revert DrillProofErrors.ZeroAddress();
        _validateThresholds(thresholds_);
        accessController = DrillProofAccess(accessController_);
        datasetRegistry = IDatasetRegistry(datasetRegistry_);
        _thresholds = thresholds_;
    }

    modifier onlyValidator() {
        if (!accessController.hasRole(accessController.VALIDATOR_ROLE(), msg.sender)) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier onlyFinalizationManager() {
        if (!accessController.hasRole(accessController.AUDITOR_ROLE(), msg.sender)) revert DrillProofErrors.Unauthorized();
        _;
    }

    modifier whenProtocolActive() {
        if (accessController.paused()) revert DrillProofErrors.ProtocolPaused();
        _;
    }

    function submitReview(uint256 datasetId, bool approved, uint16 confidenceBps, string calldata reviewUri)
        external
        onlyValidator
        whenProtocolActive
    {
        if (confidenceBps > 10_000) revert DrillProofErrors.InvalidConfidence();
        if (bytes(reviewUri).length == 0) revert DrillProofErrors.EmptyUri();
        if (_reviews[datasetId][msg.sender].exists) revert DrillProofErrors.ReviewAlreadySubmitted();

        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        if (dataset.status == DatasetStatus.APPROVED || dataset.status == DatasetStatus.REJECTED || dataset.status == DatasetStatus.FINALIZED) {
            revert DrillProofErrors.SubmissionClosed();
        }

        if (dataset.status == DatasetStatus.PENDING) {
            datasetRegistry.markUnderReview(datasetId);
        }

        _reviews[datasetId][msg.sender] = Review({
            exists: true,
            approved: approved,
            confidenceBps: confidenceBps,
            reviewUri: reviewUri,
            reviewer: msg.sender,
            createdAt: uint64(block.timestamp)
        });
        _reviewers[datasetId].push(msg.sender);
        _confidenceTotals[datasetId] += confidenceBps;

        uint32 approvals = dataset.approvalCount + (approved ? 1 : 0);
        uint32 rejections = dataset.rejectionCount + (approved ? 0 : 1);
        uint32 totalReviews = approvals + rejections;
        uint32 aggregateConfidenceBps = uint32(_confidenceTotals[datasetId] / totalReviews);
        DatasetStatus nextStatus = _resolveStatus(totalReviews, approvals, aggregateConfidenceBps);

        datasetRegistry.recordValidationState(datasetId, aggregateConfidenceBps, approvals, rejections, nextStatus);
        emit DrillProofEvents.ReviewSubmitted(datasetId, msg.sender, approved, confidenceBps);
    }

    function finalizeDataset(uint256 datasetId) external onlyFinalizationManager whenProtocolActive {
        if (!isFinalizationEligible(datasetId)) revert DrillProofErrors.FinalizationNotReady();
        datasetRegistry.finalizeDataset(datasetId);
    }

    function setThresholds(ValidationThresholds calldata thresholds_) external whenProtocolActive {
        if (!accessController.hasRole(accessController.DEFAULT_ADMIN_ROLE(), msg.sender)) revert DrillProofErrors.Unauthorized();
        _validateThresholds(thresholds_);
        _thresholds = thresholds_;
        emit DrillProofEvents.ThresholdsUpdated(
            thresholds_.minValidatorCount, thresholds_.minApprovalRatioBps, thresholds_.minConfidenceBps
        );
    }

    function getReview(uint256 datasetId, address reviewer) external view returns (Review memory review) {
        review = _reviews[datasetId][reviewer];
    }

    function getReviewers(uint256 datasetId) external view returns (address[] memory reviewers) {
        reviewers = _reviewers[datasetId];
    }

    function getThresholds() external view returns (ValidationThresholds memory thresholds) {
        thresholds = _thresholds;
    }

    function isFinalizationEligible(uint256 datasetId) public view returns (bool eligible) {
        DatasetRecord memory dataset = datasetRegistry.getDataset(datasetId);
        uint32 totalReviews = dataset.approvalCount + dataset.rejectionCount;
        if (dataset.status != DatasetStatus.APPROVED) return false;
        if (totalReviews < _thresholds.minValidatorCount) return false;

        uint256 approvalRatioBps = totalReviews == 0 ? 0 : (uint256(dataset.approvalCount) * 10_000) / totalReviews;
        eligible = approvalRatioBps >= _thresholds.minApprovalRatioBps
            && dataset.aggregateConfidenceBps >= _thresholds.minConfidenceBps;
    }

    function _resolveStatus(uint32 totalReviews, uint32 approvals, uint32 aggregateConfidenceBps)
        internal
        view
        returns (DatasetStatus)
    {
        if (totalReviews < _thresholds.minValidatorCount) {
            return DatasetStatus.UNDER_REVIEW;
        }

        uint256 approvalRatioBps = (uint256(approvals) * 10_000) / totalReviews;
        if (approvalRatioBps >= _thresholds.minApprovalRatioBps && aggregateConfidenceBps >= _thresholds.minConfidenceBps) {
            return DatasetStatus.APPROVED;
        }

        return DatasetStatus.REJECTED;
    }

    function _validateThresholds(ValidationThresholds memory thresholds_) internal pure {
        if (
            thresholds_.minValidatorCount == 0 || thresholds_.minApprovalRatioBps > 10_000
                || thresholds_.minConfidenceBps > 10_000
        ) revert DrillProofErrors.ThresholdOutOfRange();
    }
}
