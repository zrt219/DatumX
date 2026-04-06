// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDrillProofTypes} from "./IDrillProofTypes.sol";

interface IProjectAdapter {
    function expectedProjectKey() external view returns (bytes32 projectKey);

    function normalizeSubmission(
        bytes32 projectKey,
        IDrillProofTypes.AdapterPayload calldata payload,
        string calldata uri,
        bytes32 parentDatasetHash,
        address submitter
    ) external view returns (IDrillProofTypes.CanonicalDatasetInput memory canonicalInput);
}
