// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseProjectAdapter} from "./BaseProjectAdapter.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {ProjectKeys} from "../libraries/ProjectKeys.sol";

contract ShirleyCentralAdapter is BaseProjectAdapter {
    constructor() BaseProjectAdapter(ProjectKeys.SHIRLEY_CENTRAL, 100, "SC-") {}

    function _validateProjectSpecific(IDrillProofTypes.AdapterPayload calldata payload) internal pure override {
        if (payload.datasetType == IDrillProofTypes.DatasetType.DRILL_TARGET_PACKAGE && payload.recordCount < 1_000) {
            revert DrillProofErrors.InvalidPayload();
        }
    }
}
