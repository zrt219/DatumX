// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProjectAdapter} from "../interfaces/IProjectAdapter.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DatasetHashing} from "../libraries/DatasetHashing.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";

abstract contract BaseProjectAdapter is IProjectAdapter {
    bytes32 public immutable expectedProjectKey;
    uint32 public immutable minimumRecordCount;
    string public submissionPrefix;

    constructor(bytes32 expectedProjectKey_, uint32 minimumRecordCount_, string memory submissionPrefix_) {
        expectedProjectKey = expectedProjectKey_;
        minimumRecordCount = minimumRecordCount_;
        submissionPrefix = submissionPrefix_;
    }

    function normalizeSubmission(
        bytes32 projectKey,
        IDrillProofTypes.AdapterPayload calldata payload,
        string calldata uri,
        bytes32 parentDatasetHash,
        address
    ) external view returns (IDrillProofTypes.CanonicalDatasetInput memory canonicalInput) {
        if (projectKey == bytes32(0)) revert DrillProofErrors.InvalidProjectKey();
        if (projectKey != expectedProjectKey) revert DrillProofErrors.AdapterProjectKeyMismatch();
        if (bytes(uri).length == 0) revert DrillProofErrors.EmptyUri();
        if (payload.schemaVersion == 0 || payload.claimedConfidenceBps == 0 || payload.claimedConfidenceBps > 10_000) {
            revert DrillProofErrors.InvalidPayload();
        }
        if (payload.recordCount < minimumRecordCount) revert DrillProofErrors.InvalidPayload();
        if (uint8(payload.datasetType) > uint8(IDrillProofTypes.DatasetType.DRILL_TARGET_PACKAGE)) {
            revert DrillProofErrors.InvalidPayload();
        }
        if (!_hasPrefix(payload.submissionId, submissionPrefix)) revert DrillProofErrors.InvalidPayload();

        _validateProjectSpecific(payload);

        IDrillProofTypes.DatasetType datasetType = IDrillProofTypes.DatasetType(payload.datasetType);

        canonicalInput = IDrillProofTypes.CanonicalDatasetInput({
            projectKey: projectKey,
            datasetType: datasetType,
            contentHash: _computeContentHash(projectKey, payload, parentDatasetHash, uri),
            parentDatasetHash: parentDatasetHash,
            uri: uri,
            schemaVersion: payload.schemaVersion,
            recordCount: payload.recordCount,
            claimedConfidenceBps: payload.claimedConfidenceBps
        });
    }

    function _hasPrefix(string memory value, string memory prefix) internal pure returns (bool) {
        bytes memory valueBytes = bytes(value);
        bytes memory prefixBytes = bytes(prefix);
        if (valueBytes.length < prefixBytes.length) return false;
        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (valueBytes[i] != prefixBytes[i]) return false;
        }
        return true;
    }

    function _computeContentHash(
        bytes32 projectKey,
        IDrillProofTypes.AdapterPayload calldata payload,
        bytes32 parentDatasetHash,
        string memory uri
    ) internal pure returns (bytes32) {
        return DatasetHashing.hashCanonicalContent(projectKey, payload, parentDatasetHash, uri);
    }

    function _validateProjectSpecific(IDrillProofTypes.AdapterPayload calldata payload) internal view virtual;
}
