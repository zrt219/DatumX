// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DeployBotChainRegistry} from "../script/DeployBotChainRegistry.s.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

contract DeployBotChainRegistryTest is Test {
    DeployBotChainRegistry public deployScript;
    uint256 internal dummyPrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;

    function setUp() public {
        deployScript = new DeployBotChainRegistry();
    }

    function testCannotDeployToMainnet() public {
        vm.expectRevert(DeployBotChainRegistry.MainnetDeploymentProhibited.selector);
        deployScript.deploy(677, true, dummyPrivateKey, false);
    }

    function testCannotDeployToUnsupportedChain() public {
        vm.expectRevert(DeployBotChainRegistry.InvalidTargetChain.selector);
        deployScript.deploy(1337, true, dummyPrivateKey, false);

        vm.expectRevert(DeployBotChainRegistry.InvalidTargetChain.selector);
        deployScript.deploy(1, true, dummyPrivateKey, false);
    }

    function testCannotDeployWithoutAuthorization() public {
        vm.expectRevert(DeployBotChainRegistry.DeploymentNotAuthorized.selector);
        deployScript.deploy(968, false, dummyPrivateKey, false);
    }

    function testCannotDeployWithoutSigningKey() public {
        vm.expectRevert(DeployBotChainRegistry.MissingDeployerKey.selector);
        deployScript.deploy(968, true, 0, false);
    }

    function testDeployDefaultsToAllowlistedWhenAuthorized() public {
        address deployed = deployScript.deploy(968, true, dummyPrivateKey, false);
        assertTrue(deployed != address(0));

        BotChainDatasetRegistry registry = BotChainDatasetRegistry(deployed);
        assertFalse(registry.publicRegistrationEnabled());
    }

    function testDeployEnablesPublicRegistrationWhenExplicitlyApproved() public {
        address deployed = deployScript.deploy(968, true, dummyPrivateKey, true);
        assertTrue(deployed != address(0));

        BotChainDatasetRegistry registry = BotChainDatasetRegistry(deployed);
        assertTrue(registry.publicRegistrationEnabled());
    }

    function testDeploySupportedOnAnvil() public {
        address deployed = deployScript.deploy(31337, true, dummyPrivateKey, false);
        assertTrue(deployed != address(0));
    }

    function testRunEntrypointWithEnvironment() public {
        vm.chainId(968);
        vm.setEnv("BOTCHAIN_DEPLOY_AUTHORIZED", "true");
        vm.setEnv("BOTCHAIN_PRIVATE_KEY", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
        vm.setEnv("BOTCHAIN_ENABLE_PUBLIC_REGISTRATION", "false");

        address deployed = deployScript.run();
        assertTrue(deployed != address(0));
        assertFalse(BotChainDatasetRegistry(deployed).publicRegistrationEnabled());
    }
}
