// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseProjectAdapter} from "./BaseProjectAdapter.sol";
import {IDrillProofTypes} from "../interfaces/IDrillProofTypes.sol";
import {DrillProofErrors} from "../libraries/DrillProofErrors.sol";
import {ProjectKeys} from "../libraries/ProjectKeys.sol";

contract DuckCreekAdapter is BaseProjectAdapter {
    constructor() BaseProjectAdapter(ProjectKeys.DUCK_CREEK, 25, "DC-") {}

    function _validateProjectSpecific(IDrillProofTypes.AdapterPayload calldata payload) internal pure override {
        if (payload.claimedConfidenceBps < 4_500) revert DrillProofErrors.InvalidConfidence();
    }
}
