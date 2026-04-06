// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";

library DatasetHashing {
    function hashCanonicalContent(
        bytes32 projectKey,
        IDrillProofTypes.AdapterPayload memory payload,
        bytes32 parentDatasetHash,
        string memory uri
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                projectKey,
                payload.sourceHash,
                payload.transformHash,
                parentDatasetHash,
                payload.datasetType,
                payload.schemaVersion,
                payload.recordCount,
                payload.claimedConfidenceBps,
                payload.submissionId,
                uri
            )
        );
    }
}
