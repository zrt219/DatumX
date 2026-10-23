// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DeployBotChainRegistry} from "../script/DeployBotChainRegistry.s.sol";

contract DeployBotChainGuardTest is Test {
    function testDeploymentRejectsUnexpectedChainBeforeReadingKeys() public {
        DeployBotChainRegistry script = new DeployBotChainRegistry();
        vm.chainId(1);
        vm.expectRevert(DeployBotChainRegistry.InvalidTargetChain.selector);
        script.run();
    }
}
