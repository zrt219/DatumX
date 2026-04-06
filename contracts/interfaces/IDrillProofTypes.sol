// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDrillProofTypes {
    enum DatasetType {
        RAW_SCAN_BATCH,
        EXTRACTED_TRACES,
        INTERPRETED_INTERVALS,
        COMPOSITE_STATISTICS,
        DRILL_TARGET_PACKAGE
    }

    enum DatasetStatus {
        PENDING,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        FINALIZED
    }

    struct CanonicalDatasetInput {
        bytes32 projectKey;
        DatasetType datasetType;
        bytes32 contentHash;
        bytes32 parentDatasetHash;
        string uri;
        uint16 schemaVersion;
        uint32 recordCount;
        uint32 claimedConfidenceBps;
    }

    struct DatasetRecord {
        uint256 datasetId;
        bytes32 projectKey;
        DatasetType datasetType;
        DatasetStatus status;
        bytes32 contentHash;
        bytes32 parentDatasetHash;
        string uri;
        uint16 schemaVersion;
        uint32 recordCount;
        uint32 aggregateConfidenceBps;
        uint32 approvalCount;
        uint32 rejectionCount;
        address submitter;
        uint64 createdAt;
        uint64 updatedAt;
        uint64 finalizedAt;
    }

    struct Review {
        bool exists;
        bool approved;
        uint16 confidenceBps;
        string reviewUri;
        address reviewer;
        uint64 createdAt;
    }

    struct ProjectMetadata {
        string name;
        string basin;
        string commodity;
        string depositType;
        string jurisdiction;
        bool active;
        address adapter;
    }

    struct ValidationThresholds {
        uint16 minValidatorCount;
        uint16 minApprovalRatioBps;
        uint16 minConfidenceBps;
    }

    struct AdapterPayload {
        DatasetType datasetType;
        uint16 schemaVersion;
        uint32 recordCount;
        uint32 claimedConfidenceBps;
        bytes32 sourceHash;
        bytes32 transformHash;
        string submissionId;
    }
}
