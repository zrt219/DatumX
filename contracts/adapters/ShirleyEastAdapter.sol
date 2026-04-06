// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseProjectAdapter} from "./BaseProjectAdapter.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {ProjectKeys} from "../libraries/ProjectKeys.sol";

contract ShirleyEastAdapter is BaseProjectAdapter {
    constructor() BaseProjectAdapter(ProjectKeys.SHIRLEY_EAST, 50, "SE-") {}

    function _validateProjectSpecific(IDrillProofTypes.AdapterPayload calldata payload) internal pure override {
        if (payload.datasetType == IDrillProofTypes.DatasetType.RAW_SCAN_BATCH && payload.schemaVersion < 1) {
            revert DrillProofErrors.InvalidPayload();
        }
    }
}
