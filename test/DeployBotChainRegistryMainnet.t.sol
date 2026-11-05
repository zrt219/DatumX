// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DeployBotChainRegistryMainnet} from "../script/DeployBotChainRegistryMainnet.s.sol";
import {BotChainDatasetRegistry} from "../contracts/botchain/BotChainDatasetRegistry.sol";

contract DeployBotChainRegistryMainnetTest is Test {
    DeployBotChainRegistryMainnet public deployScript;
    uint256 internal dummyPrivateKey = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    address internal deployerAddress;

    function setUp() public {
        deployScript = new DeployBotChainRegistryMainnet();
        deployerAddress = vm.addr(dummyPrivateKey);
    }

    function testCannotDeployToBohrTestnet() public {
        vm.expectRevert(DeployBotChainRegistryMainnet.InvalidMainnetChain.selector);
        deployScript.deploy(968, true, dummyPrivateKey);
    }

    function testCannotDeployToXRPL() public {
        vm.expectRevert(DeployBotChainRegistryMainnet.InvalidMainnetChain.selector);
        deployScript.deploy(1449000, true, dummyPrivateKey);
    }

    function testCannotDeployToAnvilOrEthereum() public {
        vm.expectRevert(DeployBotChainRegistryMainnet.InvalidMainnetChain.selector);
        deployScript.deploy(31337, true, dummyPrivateKey);

        vm.expectRevert(DeployBotChainRegistryMainnet.InvalidMainnetChain.selector);
        deployScript.deploy(1, true, dummyPrivateKey);
    }

    function testCannotDeployWithoutAuthorization() public {
        vm.expectRevert(DeployBotChainRegistryMainnet.DeploymentNotAuthorized.selector);
        deployScript.deploy(677, false, dummyPrivateKey);
    }

    function testCannotDeployWithoutSigningKey() public {
        vm.expectRevert(DeployBotChainRegistryMainnet.MissingDeployerKey.selector);
        deployScript.deploy(677, true, 0);
    }

    function testDeployStrictlyEnforcesPublicRegistrationDisabled() public {
        address deployed = deployScript.deploy(677, true, dummyPrivateKey);
        assertTrue(deployed != address(0));

        BotChainDatasetRegistry registry = BotChainDatasetRegistry(deployed);
        assertFalse(registry.publicRegistrationEnabled());
        assertEq(registry.owner(), deployerAddress);
    }

    function testOwnerControlsSubmitterAuthorizationOnMainnet() public {
        address deployed = deployScript.deploy(677, true, dummyPrivateKey);
        BotChainDatasetRegistry registry = BotChainDatasetRegistry(deployed);

        address authorizedUser = address(0xAA11);
        address unauthorizedUser = address(0xBB22);

        // Submissions by unauthorized user must revert
        vm.prank(unauthorizedUser);
        vm.expectRevert(BotChainDatasetRegistry.Unauthorized.selector);
        registry.registerDataset(
            keccak256("SYNTH-001"),
            keccak256("CONTENT-001"),
            "1.0.0",
            "https://datumx.io/meta.json"
        );

        // Owner authorizes user
        vm.prank(deployerAddress);
        registry.setAuthorizedSubmitter(authorizedUser, true);
        assertTrue(registry.authorizedSubmitters(authorizedUser));

        // Authorized user can now register
        vm.prank(authorizedUser);
        bool success = registry.registerDataset(
            keccak256("SYNTH-001"),
            keccak256("CONTENT-001"),
            "1.0.0",
            "https://datumx.io/meta.json"
        );
        assertTrue(success);

        // Owner can always register
        vm.prank(deployerAddress);
        bool ownerSuccess = registry.registerDataset(
            keccak256("SYNTH-002"),
            keccak256("CONTENT-002"),
            "1.0.0",
            "https://datumx.io/meta.json"
        );
        assertTrue(ownerSuccess);
    }

    function testRunEntrypointWithEnvironmentOnChain677() public {
        vm.chainId(677);
        vm.setEnv("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", "true");
        vm.setEnv("BOTCHAIN_MAINNET_PRIVATE_KEY", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

        address deployed = deployScript.run();
        assertTrue(deployed != address(0));
        assertFalse(BotChainDatasetRegistry(deployed).publicRegistrationEnabled());
    }

    function testRunAcceptsRawHexPrivateKeyWithout0xPrefix() public {
        vm.chainId(677);
        vm.setEnv("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", "true");
        vm.setEnv("BOTCHAIN_MAINNET_PRIVATE_KEY", "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

        address deployed = deployScript.run();
        assertTrue(deployed != address(0));
        assertFalse(BotChainDatasetRegistry(deployed).publicRegistrationEnabled());
    }

    function testRunIgnoresAnyPublicRegistrationEnvOverride() public {
        vm.chainId(677);
        vm.setEnv("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", "true");
        vm.setEnv("BOTCHAIN_MAINNET_PRIVATE_KEY", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
        // Adversarial attempt to enable public registration via environment variable
        vm.setEnv("BOTCHAIN_MAINNET_ENABLE_PUBLIC_REGISTRATION", "true");

        address deployed = deployScript.run();
        assertTrue(deployed != address(0));
        assertFalse(
            BotChainDatasetRegistry(deployed).publicRegistrationEnabled(),
            "Public registration must remain strictly disabled despite environment variable"
        );
    }

    function testRunEntrypointFailsClosedOnTestnet() public {
        vm.chainId(968);
        vm.setEnv("BOTCHAIN_MAINNET_DEPLOY_AUTHORIZED", "true");
        vm.setEnv("BOTCHAIN_MAINNET_PRIVATE_KEY", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");

        vm.expectRevert(DeployBotChainRegistryMainnet.InvalidMainnetChain.selector);
        deployScript.run();
    }
}
